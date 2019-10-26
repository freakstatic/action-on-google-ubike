const req = require('request').defaults({jar: true});

const API_URL = 'http://api.ubike.ipleiria.pt/cxf/';

class UBikeController {


    constructor() {

    }


    authenticate(urlWithAccessToken) {
        return new Promise((resolve, reject) => {
            req.post({
                url: API_URL + 'sm/auth',
                json: {
                    authType: "IPL",
                    result: urlWithAccessToken
                }
            }, async (error, request, body) => {
                if (error || !body) {
                    reject('Failed to authenticate with ubike API');
                    return;
                }

                this.authenticationToken = request.headers['be-token'];
                resolve(this.authenticationToken);
            });
        });
    }

    unlockUbike(ubikeNumber) {
        return new Promise((resolve, reject) => {
            req.put({
                url: API_URL + 'rm/routes/' + ubikeNumber,
                headers: {
                    "be-token": this.authenticationToken
                }
            }, function (e, r, body) {
                if (e || r.statusCode !== 200) {
                    reject("Failed to unlock the selected ubike");
                    return;
                }
                resolve();
            });
        });
    }

    async setAuthenticationToken(authenticationToken) {
        this.authenticationToken = authenticationToken;
    }

    async iAuthenticationTokenValid(ubikeNumber) {
        if (!this.authenticationToken) {
            return false;
        }

        return new Promise((resolve) => {
            req.get({
                url: "http://api.ubike.ipleiria.pt/cxf/am/cycle/cycleNumber/" + ubikeNumber,
                headers: {
                    "be-token": this.authenticationToken
                }
            }, (error, response, body) => {
                if (error) {
                    resolve(false);
                    return;
                }

                resolve(response.statusCode === 200);
            });

        });
    }

    static getAuthProvider() {
        return new Promise((resolve, reject) => {
            req.get({
                url: API_URL + 'cm/settings/gsAuthProvider',
                json: true
            }, function (e, r, body) {
                if (e || !body) {
                    reject('Failed to get the auth provider');
                    return;
                }

                resolve(body);
            });
        });
    }


}

module.exports = UBikeController;