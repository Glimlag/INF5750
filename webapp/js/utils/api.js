import { API_URL } from '../constants/apiUrls';
import { CREATED, UPDATED, DELETED } from '../constants/apiHistoryActions';
import { sprintf } from 'sprintf-js';

let apiClass = undefined;

class Api
{

    constructor(url, auth) {
        this.url = url;
        this.auth = auth;
        this.cache = [];
        this.ignoredStores = ['METADATASTORE', 'HISTORYSTORE'];

        fetch(`${this.url}/me`, this.getHeaders())
            .then(response => this.successOnly(response))
            .then(response => response.json())
            .then(user => this.userId = user.userCredentials.username);
    }

    getNamespaces() {
        const ignoredStores = this.ignoredStores;

        return fetch(`${this.url}/dataStore`, this.getHeaders())
            .then(response => this.successOnly(response))
            .then(response => response.json())
            .then(response => response.filter((value) => ignoredStores.indexOf(value) === -1));
    }

    deleteNamespace(namespace) {
        return fetch(`${this.url}/dataStore/${namespace}`, Object.assign({}, this.getHeaders(), {
            method: 'DELETE',
        }))
            .then(response => this.successOnly(response))
            .then(response => response.json());
    }

    getKeys(namespace) {
        return fetch(`${this.url}/dataStore/${namespace}`, this.getHeaders())
            .then(response => this.successOnly(response))
            .then(response => response.json())
            .catch(error => Promise.reject(error));
    }

    getValue(namespace, key) {
        const k = this.buildId(namespace, key);
        const cache = this.cache;

        if (!cache[k]) {
            return this.getMetaData(namespace, key)
                .then(result => {
                    const val = JSON.parse(result.value);
                    cache[k] = val;
                    return val;
                });
        }

        return new Promise((resolve) => {
            console.log('cache resolve');
            resolve(cache[k]);
        });
    }

    getMetaData(namespace, key) {
        return fetch(`${this.url}/dataStore/${namespace}/${key}/metaData`, this.getHeaders())
            .then(response => this.successOnly(response))
            .then(response => response.json());
    }

    createValue(namespace, key, value, log = true) {
        return fetch(`${this.url}/dataStore/${namespace}/${key}`, Object.assign({}, this.getHeaders(), {
            method: 'POST',
            body: JSON.stringify(value),
        }))
            .then(response => this.successOnly(response))
            .then(response => response.json())
            .then(response => {
                log && this.updateHistory(namespace, key, value, CREATED);
                return response;
            });
    }

    updateValue(namespace, key, value, log = true) {
        return fetch(`${this.url}/dataStore/${namespace}/${key}`, Object.assign({}, this.getHeaders(), {
            method: 'PUT',
            body: JSON.stringify(value),
        }))
            .then(response => this.successOnly(response))
            .then(response => response.json())
            .then(response => {
                this.cache[this.buildId(namespace, key)] = value;
                log && this.updateHistory(namespace, key, value, UPDATED);
                return response;
            });
    }

    deleteValue(namespace, key) {
        return fetch(`${this.url}/dataStore/${namespace}/${key}`, Object.assign({}, this.getHeaders(), {
            method: 'DELETE',
        }))
            .then(response => this.successOnly(response))
            .then(response => response.json())
            .then(response => {
                this.updateHistory(namespace, key, this.getValue(namespace, key), DELETED);
                return response;
            });
    }


    getHistory(namespace, key = null) {
        const id = key === null ? namespace : this.buildId(namespace, key);
        return fetch(`${this.url}/dataStore/HISTORYSTORE/${id}`, this.getHeaders());
    }

    getHistoryOfKey(namespace, key) {
        const id = this.buildId(namespace, key);
        return fetch(`${this.url}/dataStore/HISTORYSTORE/${id}`, this.getHeaders())
          .then(response => this.successOnly(response))
          .then(response => response.json())
          .then(response => response);
    }

    getHistoryOfNamespace(namespace) {
        return fetch(`${this.url}/dataStore/HISTORYSTORE/${namespace}`, this.getHeaders())
          .then(response => this.successOnly(response))
          .then(response => response.json())
          .then(response => response);
    }

    updateHistory(namespace, key, newValue, action) {
        const id = this.buildId(namespace, key);
        const historyRecord = {
            action,
            date: new Date(),
            user: this.userId,
            value: newValue,
        };

        return this.getHistory(namespace, key)
            .then(response => {
                if (response.status === 404) {
                    this.createValue('HISTORYSTORE', id, [historyRecord], false);
                    return null;
                }
                return response.json();
            }).then(history => {
                if (history !== null) {
                    history.unshift(historyRecord);
                    this.updateValue('HISTORYSTORE', id, history, false);
                }
            }).then(foo => this.updateNamespaceHistory(namespace, key, historyRecord));
    }

    updateNamespaceHistory(namespace, key, historyRecord) {
        const namespaceHistoryRecord = {
            action: UPDATED,
            date: new Date(),
            user: historyRecord.user,
            value: sprintf('Key \'%s\' was %s.', key, historyRecord.action.toLowerCase()),
        };

        return this.getHistory(namespace)
            .then(response => {
                console.log(response);
                if (response.status === 404) {
                    const value = [{
                        action: CREATED,
                        date: namespaceHistoryRecord.date,
                        user: historyRecord.user,
                        value: 'Namespace was created.',
                    }];

                    return this.createValue('HISTORYSTORE', namespace, value, false)
                        .then(response => new Promise((resolve, reject) => resolve(value)));
                }
                return response.json();
            }).then(history => {
                history.unshift(namespaceHistoryRecord);
                this.updateValue('HISTORYSTORE', namespace, history, false);
            });
    }

    successOnly(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response);
        }
        return Promise.reject(response);
    }

    buildId(namespace, key) {
        return encodeURIComponent(`${namespace}:${key}`);
    }

    getHeaders() {
        return {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.auth,
            },
        };
    }
}

export default (function getApi() {
    if (typeof apiClass === 'undefined') {
        apiClass = new Api(API_URL, `Basic ${btoa('admin:district')}`);
    }

    return apiClass;
}());
