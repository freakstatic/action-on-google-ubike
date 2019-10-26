const req = require('request').defaults({jar: true});
const cheerio = require('cheerio');
const UBikeController = require('./UBikeController.js');

class IPLController {

    async computeUrlWithAccessToken(email, password) {
        let authData = await this.computeAuthData();
        await this.computeMsisSTokens();
        let samlResponse = await this.computeSamlResponse(email, password);
        return await this.makeRequestOfUrlWithAccessToken(samlResponse, authData.relayState);
    }

    async computeAuthData() {
        let authProvider = await UBikeController.getAuthProvider();
        let authUrl = authProvider.properties.value[1].url.value;
        let authData = await IPLController.getAuthFormData(authUrl);
        await IPLController.getTokens(authData);
        return authData;
    }

    static getAuthFormData(authUrl) {
        return new Promise((resolve, reject) => {
            req.get({
                url: authUrl
            }, function (error, response, body) {
                if (error || !body || response.statusCode !== 200) {
                    reject('Failed to get IPL auth form data');
                    return;
                }
                const $ = cheerio.load(body);
                let $form = $('form');
                resolve({
                    url: $form.attr('action'),
                    relayState: $form.find('input[name="RelayState"]').val(),
                    samlRequest: $form.find('input[name="SAMLRequest"]').val()
                });
            });
        });
    }

    static getTokens(authData) {
        return new Promise((resolve, reject) => {
            req.post({
                    url: 'https://login.ipleiria.pt/adfs/ls',
                    form: {
                        SAMLRequest: authData.samlRequest,
                        RelayState: authData.relayState
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    followAllRedirects: true
                },
                function (error, response, body) {
                    if (error || !body || !response.headers['set-cookie'] || response.statusCode !== 200) {
                        reject('Failed to get SAML cookies');
                        return;
                    }

                    let cookies = response.headers['set-cookie'];

                    if (!cookies){
                        reject(errorMessage);
                        return;
                    }

                    let msiSamlRequest = cookies[0].split(';')[0];
                    let msiSSamlRequest1 = cookies[1].split(';')[0];
                    resolve({
                        msiSamlRequest: msiSamlRequest,
                        msiSSamlRequest1: msiSSamlRequest1
                    });
                });
        });
    }

    computeSamlResponse(email, password) {
        return new Promise((resolve, reject) => {
            req.post({
                    url: 'https://login.ipleiria.pt/adfs/ls?RedirectToIdentityProvider=http%3a%2f%2flogin.ipleiria.pt%2fadfs%2fservices%2ftrust',
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
                function (e, response, body) {
                    if (e || !body || response.statusCode !== 200) {
                        reject('Failed to get SAML response');
                        return;
                    }

                    const $ = cheerio.load(body);
                    const samlResponse = $('input').val();
                    resolve(samlResponse);
                });
        });
    }

    makeRequestOfUrlWithAccessToken(samlResponse, relayState){
        return new Promise((resolve, reject) => {
            req.post({
                    url: 'https://km.apim.ipleiria.pt/commonauth',
                    form: {
                        SAMLResponse: samlResponse,
                        RelayState: relayState
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    followAllRedirects: true,
                    maxRedirects: 3
                },
                function (error, request, body) {
                    if (error && !this.headers.referer) {
                        reject('Failed to get SAML response');
                        return;
                    }

                    resolve(this.headers.referer);
                });
        });
    }

    async computeMsisSTokens() {
        return new Promise((resolve, reject) => {
            req.post({
                url: 'https://login.ipleiria.pt/adfs/ls',
                form: {
                    HomeRealmSelection: 'http://login.ipleiria.pt/adfs/services/trust',
                    Email: ''
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

                resolve();
            });
        });
    }



}

module.exports = IPLController;