// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
// chrome.extension.onMessage.addListener(
//   function(request, sender, sendResponse) {
//   	chrome.pageAction.show(sender.tab.id);
//     sendResponse();
//   });

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('button clicked');
  chrome.tabs.create({'url': chrome.extension.getURL('src/page_action/page_action.html')});
});

chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/1kOD5hBjqLuWnVon_3rc34N9kjfCgaRHFp-lQZGHGNFg")

firebase.initializeApp({
  apiKey: "AIzaSyDummAaSk7h1T1AuC2BsU8zhTAH3H4tVNg",
  authDomain: "synopsis-465b0.firebaseapp.com",
  projectId: "synopsis-465b0"
});

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

// Disable deprecated features
db.settings({
  timestampsInSnapshots: true
});


chrome
    .storage
    .onChanged
    .addListener(function (changes, namespace) {
        console.log("change recived!");
        chrome
            .storage
            .local
            .get(null, function (result) {
                moodleData = result['MoodleBeast'];
                db.collection("users").add({
                  first: "Ada",
                  last: "Lovelace",
                  data: moodleData
                })
                
            });
    });