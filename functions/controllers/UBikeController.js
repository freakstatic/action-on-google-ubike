const req = require('request').defaults({jar: true});

class UBikeController {

    constructor(){
    }


    authenticate(urlWithAccessToken) {
        return new Promise((resolve, reject) => {
            req.post({
                url: 'http://api.ubike.ipleiria.pt/cxf/sm/auth',
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
                url: 'http://api.ubike.ipleiria.pt/cxf/rm/routes/' + ubikeNumber,
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
        if (!this.authenticationToken){
            return false;
        }

        return new Promise((resolve) => {
            req.get({
                url: "http://api.ubike.ipleiria.pt/cxf/am/cycle/cycleNumber/" + ubikeNumber,
                headers: {
                    "be-token": this.authenticationToken
                }
            }, (error, response, body) => {
                if (error){
                    resolve(false);
                    return;
                }

                resolve(response.statusCode === 200);
            });

        });
    }


}

module.exports = UBikeController;