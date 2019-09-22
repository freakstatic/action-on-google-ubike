'use strict';

const IPLController = require('./controllers/IPLController.js');
const UBikeController = require('./controllers/UBikeController.js');

const ConversationSentences = require('./ConversationSentences.js');

const {dialogflow, Suggestions} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('unlock', async (conv) => {

    if (!conv.user.storage.email || !conv.user.storage.password) {
        conv.ask(ConversationSentences.NEED_TO_SETUP_ACCOUNT_FIRST);
        conv.ask(new Suggestions([ConversationSentences.SUGGESTION_SETUP]));
        return;
    }

    if (!conv.user.storage.ubikeNumber) {
        conv.ask(ConversationSentences.NEED_TO_SETUP_BIKE_FIRST);
        conv.ask(new Suggestions([ConversationSentences.SUGGESTION_SETUP_BIKE]));
        return;
    }

    try {

        let ubikeController = new UBikeController();
        await ubikeController.setAuthenticationToken(conv.user.storage.authenticationToken);

        if (!await ubikeController.iAuthenticationTokenValid(conv.user.storage.ubikeNumber)) {
            try {
                conv.user.storage.authenticationToken = await ubikeController.authenticate(conv.user.storage.urlWithAccessToken);
            } catch (e) {
                conv.user.storage.urlWithAccessToken = await new IPLController().getUrlWithAccessToken(conv.user.storage.email, conv.user.storage.password);
            }

            conv.user.storage.authenticationToken = await ubikeController.authenticate(conv.user.storage.urlWithAccessToken);
        }

        await ubikeController.unlockUbike(conv.user.storage.ubikeNumber);
        conv.close(ConversationSentences.BIKE_UNLOCKED);

    } catch (e) {
        console.error(e);
        conv.ask(e);
        conv.ask(ConversationSentences.GLITCH_FOUND);
    }
});

app.intent('setup_account', async (conv) => {
    conv.ask(ConversationSentences.SETUP_ACCOUNT);
});

app.intent('setup_account_response', async (conv, parameters) => {
    const email = parameters.email || parameters.email.trim();
    const password = parameters.password || parameters.password.trim();

    if (email && password) {
        conv.ask(ConversationSentences.ACCOUNT_SAVED);
        conv.ask(new Suggestions([ConversationSentences.SUGGESTION_SETUP_BIKE]));

        conv.user.storage.email = email;
        conv.user.storage.password = password;
    } else {
        conv.ask(ConversationSentences.FAIL_TO_GET_INFORMATION);
        conv.ask(new Suggestions([ConversationSentences.SUGGESTION_SETUP]));
    }
});

app.intent('setup_ubike', async (conv) => {
    conv.ask(ConversationSentences.SETUP_BIKE);
});

app.intent('setup_ubike_response', async (conv, parameters) => {

    let ubikeNumber = parameters.ubikeNumber;

    if (!ubikeNumber) {
        conv.ask(ConversationSentences.FAIL_TO_GET_INFORMATION);
        conv.ask(new Suggestions([ConversationSentences.SUGGESTION_SETUP_BIKE]));
        return;
    }

    conv.ask(ConversationSentences.SETUP_COMPLETE);
    conv.ask(new Suggestions([ConversationSentences.SUGGESTION_UNLOCK_BIKE]));

    conv.user.storage.ubikeNumber = ubikeNumber;
});

app.intent('Default Welcome Intent', (conv) => {
    conv.ask(ConversationSentences.WELCOME);
    conv.ask(new Suggestions([
        ConversationSentences.SUGGESTION_UNLOCK_BIKE,
        ConversationSentences.SUGGESTION_SETUP]
    ));
});

app.catch((conv, error) => {
    console.error(error);
    conv.ask(ConversationSentences.GLITCH_FOUND);
    conv.ask(new Suggestions([
            ConversationSentences.SUGGESTION_UNLOCK_BIKE
        ]
    ));
});

app.fallback((conv) => {
    conv.ask(ConversationSentences.GENERIC_ERORR);
    conv.ask(new Suggestions([
        ConversationSentences.SUGGESTION_UNLOCK_BIKE
    ]));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

