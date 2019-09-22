# Action on Google - Ubike

This project consists in a firebase cloud functions that is used in the Google Action called `Mister Ubike`. <br />
I created this Action on Google to avoid using the Ubike App, since I had to login every freaking time...

## Usage
In the future you will probably find this Action on Google on the Google Assistant "marketplace" (I'm working on that) <br />
You just have to say `Hi Google, talk to mister ubike`, setup your IPL account and bike number and then you can use
the Google Action by just saying `unlock my bike`

### Structure
Inside the `functions` folder you can find the following files: <br />
The `IPLController.js` which is responsible of handling the authentication with the IPL Login Page (some scraping magic here 😁)   
The `UbikeController.js` which handles the authentication with the Ubike API and the bike unlocking process. <br />

### Deployment
If would like to deploy the firebase cloud function in your account follow this steps:
```
cd functions
npm install
npm run deploy
```

### Development
You can run the cloud function locally using this steps:
```
cd functions
npm install
npm run start
```
