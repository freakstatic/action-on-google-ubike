const req = require('request').defaults({jar: true});
const cheerio = require('cheerio');
const url = require('url');

class IPLController {

    async getLoginUrl() {
        let authProvider = await IPLController.getAuthProvider();
        let authUrl = authProvider.properties.value[1].url.value;
        let formAction = await IPLController.getAuthFormAction(authUrl);
        return "https://login.ipleiria.pt" + formAction;
    }

    static getAuthFormAction(authUrl) {
        return new Promise((resolve, reject) => {
            req.get({
                url: authUrl
            }, function (e, r, body) {
                if (e || !body){
                    reject('Failed to get auth form action');
                    return;
                }

                const $ = cheerio.load(body);
                resolve($('form').attr('action') + "&RedirectToIdentityProvider=http://login.ipleiria.pt/adfs/services/trust");
            });
        });

    }

    static getAuthProvider() {
        return new Promise((resolve, reject) => {
            req.get({
                url: 'http://api.ubike.ipleiria.pt/cxf/cm/settings/gsAuthProvider',
                json: true
            }, function (e, r, body) {
                if (e || !body){
                    reject('Failed to get the auth provider');
                    return;
                }

                resolve(body);
            });
        });
    }


    getSamlResponse(loginUrl, email, password) {
        return new Promise((resolve, reject) => {
            req.post({
                    url: loginUrl,
                    form: {
                        UserName: email,
                        Password: password,
                        AuthMethod: "FormsAuthentication"
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    followAllRedirects: true
                },
                function (e, r, body) {
                    if (e || !body) {
                        reject('Failed to get SAML response');
                        return;
                    }

                    const $ = cheerio.load(body);
                    const samlResponse = $('input').val();
                    resolve(samlResponse);
                });
        });
    }

    async getUrlWithAccessToken(email, password) {
        let loginUrl = await this.getLoginUrl();
        let relayState = await IPLController.getRelayStateFromLoginUrl(loginUrl);
        let samlResponse = await this.getSamlResponse(loginUrl, email, password);

        return new Promise((resolve, reject) => {
            req.post({
                url: 'https://identity.ipleiria.pt/commonauth',
                form: {
                    SAMLResponse: samlResponse,
                    RelayState: relayState
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                followAllRedirects: true
            }, function (e, r, body) {
                if (!this.href) {
                    reject('Failed to get url with access token');
                    return;
                }

                resolve(this.href);
            });
        });
    }

    static getRelayStateFromLoginUrl(loginUrl) {
        let queryData = url.parse(loginUrl, true).query;
        return queryData.RelayState;
    }

}

module.exports = IPLController;