import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })

export class SSEService {
    constructor(){}
    Listener(Route:string):Observable<any>{
        return new Observable<any>((observer)=>{
            const Source = new EventSource(Route)
            Source.onmessage=(event)=>{
                const Bool = event.data === 'True';
                observer.next(Bool);
            };
            Source.onerror=(error)=>{
                observer.error(error);
            }
            return()=>{Source.close();}
        })
    }
}