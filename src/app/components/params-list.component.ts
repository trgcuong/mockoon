import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter, map } from 'rxjs/operators';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { ServerService } from 'src/app/services/server.service';
import { Environment } from 'src/app/types/environment.type';
import { Header, headerNames, headerValues, RouteResponse, ParamRequest } from 'src/app/types/route.type';

export type HeadersListType = 'routeResponseHeaders' | 'environmentHeaders';

@Component({
  selector: 'app-params-list',
  templateUrl: 'params-list.component.html'
})
export class ParamsListComponent implements OnInit {
  @Input() data$: Observable<Environment | RouteResponse>;
  @Input() type: HeadersListType;
  @Output() headerAdded: EventEmitter<any> = new EventEmitter();
  public form: FormGroup;
  public headersFormChanges: Subscription;
  public testHeaderValidity = this.serverService.testHeaderValidity;

  constructor(
    private serverService: ServerService,
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private eventsService: EventsService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      headers: this.formBuilder.array([])
    });

    // subscribe to header injection events
    this.eventsService.injectParams.pipe(
      
    ).subscribe(params => this.injectParams(params));

    // subscribe to headers changes to reset the form
    console.log(this.data$);
    this.data$.pipe(
      filter(data => !!data),
      distinctUntilKeyChanged('uuid')
    ).subscribe(data => {
      console.log('paramsTab',data)
      // unsubscribe to prevent emitting when clearing the FormArray
      if (this.headersFormChanges) {
        this.headersFormChanges.unsubscribe();
      }

      this.replaceHeaders(data.headers);

      // subscribe to changes and send new headers values to the store
      this.headersFormChanges = this.form.get('headers').valueChanges.pipe(
      //  map(newValue => ({ headers: newValue }))
      ).subscribe(newProperty => {
        console.log('addParam',newProperty)
        this.environmentsService.updateParamRequestRoute(newProperty)
      });
    });
  }

  /**
   * Replace existing header with injected header value, or append injected header
   */
  private injectParams(param: ParamRequest[]) {
    const newParams = [...this.form.value.headers];

    param.forEach(param => {
      const paramsExistsIndex = newParams.findIndex(newParam => newParam.key === param.key);

      if (paramsExistsIndex > -1 && !newParams[paramsExistsIndex].value) {
        newParams[paramsExistsIndex] = { ...param };
      } else if (paramsExistsIndex === -1) {
        newParams.push({ ...param });
      }
    });

    this.replaceHeaders(newParams);
  }

  /**
   * Replace all headers in the FormArray
   */
  private replaceHeaders(newHeaders: Header[]) {
    const formHeadersArray = (this.form.get('headers') as FormArray);

    // clear formArray (with Angular 8 use .clear())
    while (formHeadersArray.length !== 0) {
      formHeadersArray.removeAt(0);
    }

    newHeaders.forEach(header => {
      formHeadersArray.push(this.formBuilder.group({
        key: header.key,
        value: header.value
      }));
    });
  }

  /**
   * Return observable for the typeahead directive
   */
  public search(listName: 'headerNames' | 'headerValues') {
    let list: string[];
    if (listName === 'headerNames') {
      list = headerNames;
    } else if (listName === 'headerValues') {
      list = headerValues;
    }

    return (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(100),
        distinctUntilChanged(),
        map(term => term.length < 1 ? []
          : list.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
      );
  }

  /**
   * Add a new header to the list if possible
   */
  public addParam() {
    (this.form.get('headers') as FormArray).push(this.formBuilder.group({ key: '', value: '' }));

    this.headerAdded.emit();
  }

  /**
   * Remove a header from the list
   *
   * @param headerUUID
   */
  public removeHeader(headerIndex: number) {
    (this.form.get('headers') as FormArray).removeAt(headerIndex);
  }
}
