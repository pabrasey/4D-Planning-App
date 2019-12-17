var options = {
    env: 'AutodeskProduction',
    api: 'derivativeV2',
    getAccessToken: getForgeToken,
};
var documentId = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6a2N5aXlmOTRzbjFpd3F5em0zOHdxam1mdHhwYWIwbm1fdHV0b3JpYWxfYnVja2V0L1Byb2plY3QucnZ0';

// Get public access token for read only,
// using ajax to access route /api/forge/oauth/public in the background
function getForgeToken(callback) {
    jQuery.ajax({
        url: '/api/forge/oauth/public',
        success: function (res) {
            callback(res.access_token, res.expires_in);
        }
    });
}

class Viewer {
  //viewer;

  constructor(div_id) {
		this.div_id = div_id;
		//this.Initialize();
  }

  SetColor(simcode, color){
    //console.log(this.viewer.model.getData().instanceTree)
    return new Promise(
    	(resolve, reject) => {
				this.viewer.search(
						simcode, 
						(ids) => {ids.forEach(
								(id) => { this.viewer.setThemingColor(id, color)}); resolve() }, 
								(err) => { reject(err) }, 
						"SimCode"
				)
			}
		);
    //this.viewer.getProperties(4053, (result) => {console.log(result);}, (err) => {console.log(err)})
  }

  Initialize(){
    return new Promise(
        (resolve, reject) => {
            this.resolve_initialize = resolve;
            this.reject_initialize = reject;
            var onDocumentLoadSuccess = this.OnDucumentLoadSuccess.bind(this)
            var onDocumentLoadFailure = this.OnDocumentLoadFailures
            
            Autodesk.Viewing.Initializer(options, function onInitialized(){
                this.viewerApp = new Autodesk.Viewing.ViewingApplication(this.div_id);
                this.viewerApp.registerViewer(this.viewerApp.k3D, Autodesk.Viewing.Private.GuiViewer3D, { extensions: ['PropertyInspectorExtension']});
                this.viewerApp.loadDocument(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
            }.bind(this));
        }
    );
  }

  OnDucumentLoadSuccess(doc){
      var viewables = this.viewerApp.bubble.search({'type':'geometry'});
      if (viewables.length === 0) {
          console.error('Document contains no viewables.');
          return;   }   
      // Choose any of the avialble viewables   
      var self = this
      this.viewerApp.selectItem(viewables[0].data, self.OnItemLoadSuccess.bind(this), self.OnItemLoadFail.bind(this));
  }

  OnItemLoadSuccess(viewer, item){
    console.log('onItemLoadSuccess()!');
    this.viewer = viewer;
    console.log(item);
    console.log('Viewers are equal: ' + (viewer === this.viewerApp.getCurrentViewer()));
    this.resolve_initialize(); // resolves the promise of Initialize
  }

  OnDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    reject(err) // rejects the promise of Initialize
  }

  OnItemLoadFail(errorCode) {
    console.error('onItemLoadFail() - errorCode:' + errorCode);
    this.reject_initialize(); // rejects the promise of Initialize
  }
  
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function createViewers(viewer_ids){
    //var promiseArray = [];
    
    asyncForEach(viewer_ids, async (id) => {
        viewers[id] = new Viewer(id);
        await viewers[id].Initialize();
        console.log(id);
    }).then( function(){ 
			$("#loader_container").hide(); 
			$(".viewer").resizable({
				resize: function( event, ui ) {
   					Object.keys(viewers).forEach((id) => {
						   viewers[id].viewer.resize();
					   }
					)
  				}
			}); 
		} );   
}

$("#loader_container").show();
let viewers = {};

createViewers(["En_1", "Pr_1", "Ma_1", "Tr_1", "Er_1"])

// , "En_2", "Pr_2", "Ma_2", "Tr_2", "Er_2"

/* promisfy a callback example
var request = require('request');
let url = "https://api.chucknorris.io/jokes/random";

// A function that returns a promise to resolve into the data //fetched from the API or an error
let getChuckNorrisFact = (url) => {
    return new Promise(
        (resolve, reject) => {
        request.get(url, function(error, response, data){
            if (error) reject(error);
            let content = JSON.parse(data);
            let fact = content.value;
            resolve(fact);
        })
   }
 );
};

getChuckNorrisFact(url).then(
   fact => console.log(fact) // actually outputs a string
).catch(
   error => console.(error)
);
*/