import { Injectable } from '@angular/core';
import * as express from 'express';
import { Application } from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as proxy from 'http-proxy-middleware';
import * as https from 'https';
import * as killable from 'killable';
import * as mimeTypes from 'mime-types';
import * as path from 'path';
import { ResponseRulesInterpreter } from 'src/app/classes/response-rules-interpreter';
import { Errors } from 'src/app/enums/errors.enum';
import { DummyJSONParser } from 'src/app/libs/dummy-helpers.lib';
import { ExpressMiddlewares } from 'src/app/libs/express-middlewares.lib';
import { GetRouteResponseContentType } from 'src/app/libs/utils.lib';
import { DataService } from 'src/app/services/data.service';
import { EventsService } from 'src/app/services/events.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { pemFiles } from 'src/app/ssl';
import { addRouteAction, logRequestAction, logResponseAction, updateEnvironmentStatusAction } from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';
import { Environment } from 'src/app/types/environment.type';
import { CORSHeaders, Header, mimeTypesWithTemplating, Route } from 'src/app/types/route.type';
import { URL } from 'url';
import * as uuid from 'uuid/v1';
import { IEnhancedRequest } from '../types/misc.type';
const axios = require('axios');

const httpsConfig = {
  key: pemFiles.key,
  cert: pemFiles.cert
};

@Injectable()
export class ServerService {
  // running servers instances
  private instances: { [key: string]: any } = {};

  constructor(
    private toastService: ToastsService,
    private dataService: DataService,
    private store: Store,
    private eventsService: EventsService,
  ) { }

  /**
   * Start an environment / server
   *
   * @param environment - an environment
   */
  public start(environment: Environment) {
    const server = express();
    let serverInstance;

    // create https or http server instance
    if (environment.https) {
      serverInstance = https.createServer(httpsConfig, server);
    } else {
      serverInstance = http.createServer(server);
    }

    // listen to port
    serverInstance.listen(environment.port, () => {
      this.instances[environment.uuid] = serverInstance;
      this.store.update(updateEnvironmentStatusAction({ running: true, needRestart: false }));
    });

    // apply middlewares
    ExpressMiddlewares(this.eventsService).forEach(expressMiddleware => {
      server.use(expressMiddleware);
    });

    // apply latency, cors, routes and proxy to express server
    this.logRequests(server, environment);
    this.setEnvironmentLatency(server, environment.uuid);
    this.setRoutes(server, environment);
    this.setCors(server, environment);
    this.enableProxy(server, environment);

    // handle server errors
    serverInstance.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        this.toastService.addToast('error', Errors.PORT_ALREADY_USED);
      } else if (error.code === 'EACCES') {
        this.toastService.addToast('error', Errors.PORT_INVALID);
      } else {
        this.toastService.addToast('error', error.message);
      }
    });

    killable(serverInstance);
  }

  /**
   * Completely stop an environment / server
   */
  public stop(environmentUUID: string) {
    const instance = this.instances[environmentUUID];

    if (instance) {
      instance.kill(() => {
        delete this.instances[environmentUUID];
        this.store.update(updateEnvironmentStatusAction({ running: false, needRestart: false }));
      });
    }
  }

  /**
   * Test a header validity
   *
   * @param headerName
   */
  public testHeaderValidity(headerName: string) {
    if (headerName && headerName.match(/[^A-Za-z0-9\-\!\#\$\%\&\'\*\+\.\^\_\`\|\~]/g)) {
      return true;
    }

    return false;
  }

  /**
   * Always answer with status 200 to CORS pre flight OPTIONS requests if option activated.
   * /!\ Must be called after the routes creation otherwise it will intercept all user defined OPTIONS routes.
   *
   * @param server - express instance
   * @param environment - environment to be started
   */
  private setCors(server: Application, environment: Environment) {
    if (environment.cors) {
      server.options('/*', (req, res) => {
        const environmentSelected = this.store.getEnvironmentByUUID(environment.uuid);

        this.setHeaders(CORSHeaders, req, res);

        // override default CORS headers with environment's headers
        this.setHeaders(environmentSelected.headers, req, res);

        res.send(200);
      });
    }
  }

  /**
   * Generate an environment routes and attach to running server
   *
   * @param server - server on which attach routes
   * @param environment - environment to get route schema from
   */
  private setRoutes(server: Application, environment: Environment) {
    var self = this
    environment.routes.forEach((declaredRoute: Route) => {
      const duplicatedRoutes = this.store.get('duplicatedRoutes')[environment.uuid];

      // only launch non duplicated routes
      if (!duplicatedRoutes || !duplicatedRoutes.has(declaredRoute.uuid)) {
        try {
          // create route
          server[declaredRoute.method]('/' + ((environment.endpointPrefix) ? environment.endpointPrefix + '/' : '') + declaredRoute.endpoint.replace(/ /g, '%20'), (req, res) => {
            const currentEnvironment = this.store.getEnvironmentByUUID(environment.uuid);
            const currentRoute = currentEnvironment.routes.find(route => route.uuid === declaredRoute.uuid);
            const enabledRouteResponse = new ResponseRulesInterpreter(currentRoute.responses, req).chooseResponse();

            // add route latency if any
            setTimeout(() => {
              const routeContentType = GetRouteResponseContentType(currentEnvironment, enabledRouteResponse);

              // set http code
              res.status(enabledRouteResponse.statusCode as unknown as number);

              this.setHeaders(currentEnvironment.headers, req, res);
              this.setHeaders(enabledRouteResponse.headers, req, res);

              // send the file
             
              if (enabledRouteResponse.filePath) {
                let filePath: string;

                // throw error or serve file
                try {
                  filePath = DummyJSONParser(enabledRouteResponse.filePath, req);
                  const fileMimeType = mimeTypes.lookup(enabledRouteResponse.filePath);

                  // if no route content type set to the one detected
                  if (!routeContentType) {
                    res.set('Content-Type', fileMimeType);
                  }

                  let fileContent: Buffer | string = fs.readFileSync(filePath);

                  // parse templating for a limited list of mime types
                  if (mimeTypesWithTemplating.indexOf(fileMimeType) > -1) {
                    fileContent = DummyJSONParser(fileContent.toString('utf-8', 0, fileContent.length), req);
                  }

                  if (!enabledRouteResponse.sendFileAsBody) {
                    res.set('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
                  }
                  res.send(fileContent);
                } catch (error) {
                  if (error.code === 'ENOENT') {
                    this.sendError(res, Errors.FILE_NOT_EXISTS + filePath, false);
                  } else if (error.message.indexOf('Parse error') > -1) {
                    this.sendError(res, Errors.TEMPLATE_PARSE, false);
                  }
                  res.end();
                }
              } else {
                // detect if content type is json in order to parse
                if (routeContentType === 'application/json') {
                  try {
                    res.json(JSON.parse(DummyJSONParser(enabledRouteResponse.body, req)));
                  } catch (error) {
                    // if JSON parsing error send plain text error
                    if (error.message.indexOf('Unexpected token') > -1 || error.message.indexOf('Parse error') > -1) {
                      this.sendError(res, Errors.JSON_PARSE);
                    } else if (error.message.indexOf('Missing helper') > -1) {
                      this.sendError(res, Errors.MISSING_HELPER + error.message.split('"')[1]);
                    }
                    res.end();
                  }
                } else {
                  try {
                  
                    if (enabledRouteResponse.body === "{}" && req.headers.base_url) {
                      console.log('requestRealAPI',req);
                      let baseUrl = req.headers.base_url
                      currentEnvironment.headers.forEach(header => {
                        if(header.key === "base_url" && header.value){
                          baseUrl = header.value
                        }
                      })
                      let paramObj = {}
                      let paramRoute :Header[] = []
                      decodeURIComponent(req.body).split('&').forEach(param => {
                        let paramArr = param.split('=')
                        paramObj[paramArr[0]] = paramArr[1]
                        paramRoute.push({key: paramArr[0], value: paramArr[1]})
                      })
                      console.log('paramReques',decodeURIComponent(req.body))
                    
                      axios({
                        method: req.method.toLowerCase(),
                        url: baseUrl + req.url, // base_url/route
                        headers: req.headers,
                        params: paramObj
                      })

                        .then(function (response) {
                          var resposneStr = JSON.stringify(response.data,null,2)
                          //console.log('resposneStr',resposneStr)
                          if(resposneStr === 'undefined'){
                            resposneStr = response.data.toString()
                          }
                    
                          self.addRouteWith(req, resposneStr, paramRoute);
                          res.send(resposneStr);
                          
                        })
                        .catch(function (error) {

                          console.log(error);
                          res.send(error);
                        })

                    } else {
                      console.log('mock api',req.url)
                      res.send(DummyJSONParser(enabledRouteResponse.body, req));
                    }

                  } catch (error) {
                    // if invalid Content-Type provided
                    if (error.message.indexOf('invalid media type') > -1) {
                      this.sendError(res, Errors.INVALID_CONTENT_TYPE);
                    }
                    res.end();
                  }
                }
              }
            }, enabledRouteResponse.latency);
          });
        } catch (error) {
          // if invalid regex defined
          if (error.message.indexOf('Invalid regular expression') > -1) {
            this.toastService.addToast('error', Errors.INVALID_ROUTE_REGEX + declaredRoute.endpoint);
          }
        }
      }
    });
  }

  /**
   * Apply each header to the response
   *
   * @param headers
   * @param req
   * @param res
   */
  private setHeaders(headers: Partial<Header>[], req, res) {
    headers.forEach((header) => {
      if (header.key && header.value && !this.testHeaderValidity(header.key)) {
        res.set(header.key, DummyJSONParser(header.value, req));
      }
    });
  }

  /**
   * Send an error with text/plain content type and the provided message.
   * Also display a toast.
   *
   * @param res
   * @param errorMessage
   * @param showToast
   */
  private sendError(res: any, errorMessage: string, showToast = true) {
    if (showToast) {
      this.toastService.addToast('error', errorMessage);
    }
    res.set('Content-Type', 'text/plain');
    res.send(errorMessage);
    console.log('sendError',errorMessage)
  }

  /**
   * 
   * @param req 
   * @param response 
   */
  private addRouteWith(req: any, response: string, params:Header[]) {
    var endpoint = req.url.toString()
    endpoint = endpoint.substr(1,endpoint.length-1)// remove / first
    let headers = req.headers
    let headerArr = []
    Object.keys(headers).forEach(headerKey => {
      headerArr.push({key: headerKey, value: headers[headerKey]})
    })
    //console.log('headerRequest',headers)
    const newRoute: Route = {
      method : req.method.toLowerCase(),
      endpoint: endpoint,
      documentation: '',
      params: params,
      uuid: uuid(),
      responses: [
        {
          ...{
            uuid: '',
            body: response,
            latency: 0,
            statusCode: '200',
            headers: headerArr,
            filePath: '',
            sendFileAsBody: false,
            rules: []
          },
          uuid: uuid(),
        
        }
      ]
    };
    console.log(newRoute)
    this.store.update(addRouteAction(newRoute));
  }

  /**
   * Enable catch all proxy.
   * Restream the body to the proxied API because it already has been intercepted by body parser
   *
   * @param server - server on which to launch the proxy
   * @param environment - environment to get proxy settings from
   */
  private enableProxy(server: Application, environment: Environment) {
    // Add catch all proxy if enabled
    if (environment.proxyMode && environment.proxyHost && this.isValidURL(environment.proxyHost)) {
      // res-stream the body (intercepted by body parser method) and mark as proxied
      const processRequest = (proxyReq, req, res, options) => {
        req.proxied = true;

        if (req.body) {
          proxyReq.setHeader('Content-Length', Buffer.byteLength(req.body));
          // stream the content
          proxyReq.write(req.body);
        }
      };

      // logging the proxied response
      const self = this;
      const logResponse = (proxyRes, req, res) => {
        let body = '';
        proxyRes.on('data', (chunk) => {
          body += chunk;
        });
        proxyRes.on('end', () => {
          proxyRes.getHeaders = function () {
            return proxyRes.headers;
          };
          const enhancedReq = req as IEnhancedRequest;
          const response = self.dataService.formatResponseLog(proxyRes, body, enhancedReq.uuid);
          self.store.update(logResponseAction(environment.uuid, response));
        });
      };

      const logErrorResponse = (err, req, res) => {
        // the response is logged by the overrided function
        res.status(504).send('Error occured while trying to proxy to: ' + req.url);
      };

      server.use('*', proxy({
        target: environment.proxyHost,
        secure: false,
        changeOrigin: true,
        ssl: { ...httpsConfig, agent: false },
        onProxyReq: processRequest,
        onProxyRes: logResponse,
        onError: logErrorResponse
      }));
    } else {
      // if not proxy, log the 404 response
      server.use(function (req, res, next) {
        // the send function is logging the response
        return res.status(404).send('Cannot ' + req.method + ' ' + req.url);
      });
    }
  }

  /**
   * Logs all request made to the environment
   *
   * @param server - server on which to log the request
   * @param environment - environment to link log to
   */
  private logRequests(server: Application, environment: Environment) {
    server.use((req, res, next) => {
      const log = this.dataService.formatRequestLog(req);
      log.uuid = uuid();
      const enhancedReq = req as IEnhancedRequest;
      enhancedReq.uuid = log.uuid;
      this.store.update(logRequestAction(environment.uuid, log));
      next();
    });
  }

  

  /**
   * Log all response made by the environment
   *
   * @param server - server on which to log the response
   * @param environment - environment to link log to
   */
  private logResponses(server: any, environment: Environment) {
    server.use((req, res, next) => {
      const oldSend = res.send;

      const self = this;
      res.send = function (body) {
        oldSend.apply(res, arguments);
        const enhancedReq = this.req as IEnhancedRequest;
        const responseLog = self.dataService.formatResponseLog(this, body, enhancedReq.uuid);
        self.store.update(logResponseAction(environment.uuid, responseLog));
      };

      next();
    });
  }

  /**
   * Log all error responses made by the environment
   *
   * @param server - server on which to log the response
   * @param environment - environment to link log to
   */
  private logErrorResponses(server: any, environment: Environment) {
    const self = this;
    server.use((err, req, res, next) => {
      // the response is logged by the overrided function
      return res.status(500).send(err);
    });
  }

  /**
   * Set the environment latency if any
   *
   * @param server - server instance
   * @param environmentUUID - environment UUID
   */
  private setEnvironmentLatency(server: Application, environmentUUID: string) {
    server.use((req, res, next) => {
      const environmentSelected = this.store.getEnvironmentByUUID(environmentUUID);
      setTimeout(next, environmentSelected.latency);
    });
  }

  /**
   * Test if URL is valid
   *
   * @param URL
   */
  public isValidURL(address: string): boolean {
    try {
      const myURL = new URL(address);

      return true;
    } catch (e) {
      return false;
    }
  }
}
