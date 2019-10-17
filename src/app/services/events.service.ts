import { EventEmitter, Injectable } from '@angular/core';
import { ContextMenuItem } from 'src/app/components/context-menu.component';
import { HeadersListType } from 'src/app/components/headers-list.component';
import { CollectParams } from 'src/app/services/analytics.service';
import { Header, ParamRequest } from 'src/app/types/route.type';

export type ContextMenuEvent = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

@Injectable()
export class EventsService {
  public contextMenuEvents: EventEmitter<ContextMenuEvent> = new EventEmitter();
  public settingsModalEvents: EventEmitter<any> = new EventEmitter();
  public changelogModalEvents: EventEmitter<any> = new EventEmitter();
  public analyticsEvents: EventEmitter<CollectParams> = new EventEmitter();
  public injectHeaders: EventEmitter<{ target: HeadersListType, headers: Header[] }> = new EventEmitter();
  public injectParams: EventEmitter<ParamRequest[]> = new EventEmitter();

  constructor() { }
}
