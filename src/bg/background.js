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

//show justUpdated modal if app has been updated
chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason == "update"){
      var thisVersion = chrome.runtime.getManifest().version;
      localStorage.setItem('updated', thisVersion);
      console.log('newversion!'+thisVersion)
  }
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

                if(result['sendDataOnline']){

                  moodleData = result['MoodleBeast'];
                  var dataToSendOnline = {date:new Date()}
                  Object.keys(moodleData).map(function(i,j){
                      html = $(moodleData[i]['innerHTML']);
                      dataToSendOnline[i] = {};
                      html.find('p .item-content-wrap').each(function(){
                        childrenIds = $(this).parent().parent().parent().children('ul').children('li').children('p').toArray().map(function(k){return k.id});
                        elemId = $(this).parent().parent().attr('id')
                        dataToSendOnline[i][elemId] = {
                          text:$(this).html(),
                          children:childrenIds,
                          img:$(this).siblings('img').attr('src')
                        }
                      });
                  })
                  console.log('sending data:');
                  console.log(dataToSendOnline)
                  if (!localStorage.getItem('userid')){

                    db.collection("dba").add(dataToSendOnline)
                    .then(function(docRef) {
                        localStorage.setItem('userid', docRef.id);
                        console.log('permanentref= '+ docRef.id);
                    })
                    
                  } else {

                    db.collection("dba").doc(localStorage.getItem('userid')).set(moodleData)
                    .then(function(docRef) {
                      console.log('successful overwrite: '+localStorage.getItem('userid'));
                    });

                  }
                  
                }               
            });
    });