import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Subject } from 'rxjs';
import { ScanSessionModel } from '../models/scan-session.model';

/**
 * Provides methods to store and get data from the storage
 * It implements a memory cache for the main scanSessions
 */
@Injectable()
export class ScanSessionsStorage {
  private static SCAN_SESSIONS = "scan_sessions"; // beware of editing this item. The scan sessions should be accessed only through get and set functions implemented here in order to keep the cache consistent
  private static ARCHIVED_SCAN_SESSIONS = 'archived_scan_sessions';

  private scanSessionsCache: ScanSessionModel[] = null;
  private onScanSessionSetObservable = new Subject<ScanSessionModel[]>();

  constructor(
    public storage: Storage,
  ) {
    this.onScanSessionSetObservable.debounceTime(1500).subscribe((scanSessions: ScanSessionModel[]) => {
      console.log('saving:', scanSessions)
      this.storage.set(ScanSessionsStorage.SCAN_SESSIONS, JSON.stringify(scanSessions));
    })
  }

  // Scan sessions
  setScanSessions(scanSessions: ScanSessionModel[]) {
    this.scanSessionsCache = scanSessions; // this is here in case the 'get' function gets called, so that it can return updated values
    this.onScanSessionSetObservable.next(scanSessions)
  }

  getScanSessions(): Promise<ScanSessionModel[]> {
    return new Promise((resolve, reject) => {
      if (this.scanSessionsCache != null) {
        resolve(this.scanSessionsCache);
        return;
      }

      this.storage.get(ScanSessionsStorage.SCAN_SESSIONS).then((data) => {
        if (data != null) {
          let json = JSON.parse(data);
          let result = json.map(x => {
            let scanSession: ScanSessionModel = {
              id: x.id,
              name: x.name,
              date: x.date,
              scannings: x.scannings,
              selected: false,
            }
            return scanSession;
          });
          this.scanSessionsCache = result;
          resolve(result)
        } else {
          resolve([])
        }
      });
    });
  }

  pushScanSession(scanSession: ScanSessionModel) {
    return this.getScanSessions().then(sessions => {
      let existingSessionIndex = sessions.findIndex((x) => x.id == scanSession.id); // TODO: is this check really needed?
      if (existingSessionIndex == -1) {
        sessions.unshift(scanSession); // insert at the beginning of the array
      } else {
        sessions[existingSessionIndex] = scanSession;
      }
      this.setScanSessions(sessions);
    })
  }



  // =======================================================================================
  // Archived scan sessions
  setArchivedScanSessions(scanSessions: ScanSessionModel[]) {
    return this.storage.set(ScanSessionsStorage.ARCHIVED_SCAN_SESSIONS, JSON.stringify(scanSessions));
  }

  getArchivedScanSessions(): Promise<ScanSessionModel[]> {
    return new Promise((resolve, reject) => {
      this.storage.get(ScanSessionsStorage.ARCHIVED_SCAN_SESSIONS).then((data) => {
        if (data != null) {
          let json = JSON.parse(data);
          let result = json.map(x => {
            let scanSession: ScanSessionModel = {
              id: x.id,
              name: x.name,
              date: x.date,
              scannings: x.scannings,
              selected: false,
            }
            return scanSession;
          });
          resolve(result)
        } else {
          resolve([])
        }
      });
    });
  }

  pushArchivedScanSessions(newSessions: ScanSessionModel[]) {
    return this.getArchivedScanSessions().then(sessions => {
      if (!sessions) sessions = [];
      sessions = newSessions.concat(sessions)
      this.setArchivedScanSessions(sessions);
    })
  }

  pushArchivedScanSession(newSession: ScanSessionModel) {
    return this.getArchivedScanSessions().then(sessions => {
      if (!sessions) sessions = [];
      sessions.unshift(newSession);
      this.setArchivedScanSessions(sessions);
    })
  }
}
