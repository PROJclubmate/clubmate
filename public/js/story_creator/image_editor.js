// IMAGE EDITOR
// Load our code - we're putting it all into a function so we can use diff templates in diff situations
WebFont.load({
  google: {
    families: ['Open Sans:400,800']
  },
  active: function() {
    var canvas = initCanvas('story-maker');
    setPlaceholderImgTemplate(canvas);

    // Pick new background image
    var bgpicker = document.querySelector('#backgroundpick');
    bgpicker.onchange = function(e) {
      var file = e.target.files[0];
      var reader = new FileReader();
      reader.onload = function(file) {
        addImageTemplate(canvas, file.target.result)
      }
      reader.readAsDataURL(file);
    }
    
    var addTextBoxBtn = document.getElementById('addtextbox');
    addTextBoxBtn.addEventListener('click', function(e){
      if(addTextBoxBtn.classList.contains('active')){
        addTextBoxBtn.innerHTML = '<i class="fas fa-font"></i>';
        clearCanvasTemplate(canvas);
        addTextBoxBtn.classList.remove('active');
      } else{
        addTextBoxBtn.innerHTML = '<i class="fas fa-eraser"></i>';
        addTextBoxTemplate(canvas);
        addTextBoxBtn.classList.add('active');
        canvas.setActiveObject(canvas.item(1));
        canvas.item(1).enterEditing();
      }
    });

    // Disabling Next > button on basis of textBox value || background src
    canvas.on({
      'text:changed': nextBtnStatus,
      'text:editing:entered': nextBtnStatus
    });

    function nextBtnStatus(){
      if(canvas.item(1).text == ''){
        if(canvas.item(0)._element.currentSrc == 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='){
          document.getElementById('story-maker-next').classList.add('inactive');
        } else{
          document.getElementById('story-maker-next').classList.remove('inactive');
        }
      } else{
        document.getElementById('story-maker-next').classList.remove('inactive');
      }
    }

    var cropCanvasBtn = document.getElementById('cropcanvas');
    cropCanvasBtn.addEventListener('click', function(e){
      if(cropCanvasBtn.classList.contains('active')){
        document.getElementById('story-maker-next').classList.remove('d-none');
        document.getElementById('story-footer').classList.add('d-none');
        cropCanvasBtn.classList.remove('active');
      } else{
        document.getElementById('story-maker-next').classList.add('d-none');
        document.getElementById('story-footer').classList.remove('d-none');
        cropCanvasBtn.classList.add('active');

        // Select option - what Aspect Ratio to crop
        var cropCanvasOptions = document.getElementsByClassName('crop-canvas-options');
        var selectAspectRatio = function() {
          var aspectRatio = this.id;
          var manual = true;
          document.getElementById('story-draftimg').setAttribute('is_edited', 'true');
          cropCanvasTemplate(canvas, aspectRatio, manual);
          setTimeout(function(){ 
            document.getElementById('story-maker-next').classList.remove('d-none');
            document.getElementById('story-footer').classList.add('d-none');
          }, 1000);
          cropCanvasBtn.classList.remove('active');
        };
        for (var i=0;i<cropCanvasOptions.length;i++) {
          cropCanvasOptions[i].addEventListener('click', selectAspectRatio, false);
        }
      }
    });

    // Save image
    var link = document.getElementById('saveimage');   
    link.addEventListener('click', function(ev) {
      var imgData = canvas.toDataURL({format:'jpeg', quality: 1, multiplier: 3});
      // var strDataURI = imgData.substr(22, imgData.length);
      var blob = dataURLtoBlob(imgData);
      var objurl = URL.createObjectURL(blob);
      link.download = 'story.jpg';
      link.href = objurl;
    });

    // Upload Draft image, move to step 2 - options
    var nextBtn = document.getElementById('story-maker-next');   
    nextBtn.addEventListener('click', function(ev) {
      var nextBtn = document.getElementById('story-maker-next');
      if(!nextBtn.classList.contains('inactive')){
        // If the draft image has not been modified, send straightaway to next step with exising image to set options
        if(document.getElementById('story-draftimg').getAttribute('is_edited') == 'false'){
          return location.replace('/clubs/'+ nextBtn.getAttribute('club-id') +'/story/create/options');
        // Else replace the draft image with the new image & then send to next step
        } else{
          var imgData = canvas.toDataURL({format:'webp', quality: 1, multiplier: 3});
          var type = 'image';
          var aspectRatio = document.getElementById('story-draftimg').getAttribute('aspect_ratio');
          var clubId = nextBtn.getAttribute('club-id');
          var csrfToken = nextBtn.getAttribute('csrf-token');
          sendImageDraftToServer(imgData, type, aspectRatio, clubId, csrfToken);
        }
      }
    });
  }
});

var initCanvas = (id) => {
  // Set custom canvas resolution for different aspect ratio
  var storyMaker = document.getElementById("story-maker"), ctx = storyMaker.getContext("2d");
  var storyMakerContainerWidth = document.getElementById("story-maker-container").clientWidth;
  var storyMakerContainerHeight = document.getElementById("story-maker-container").offsetHeight;
  storyMaker.style['border'] = '2px solid red';

  // Absolute positioning of canvas at the center of screen such that there is space for controls at top & bottom
  if(window.outerWidth > 768){
    storyMaker.width = 0.625*window.outerHeight;
    storyMaker.height = 0.625*window.outerHeight;
    var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
    + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
    storyMaker.style['margin'] = storyMakerMarginText;
  } else if(window.outerWidth <= 768 && window.outerWidth > 480){
    storyMaker.width = 0.625*window.outerWidth;
    storyMaker.height = 0.625*window.outerWidth;
    var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
    + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
    storyMaker.style['margin'] = storyMakerMarginText;
  } else if(window.outerWidth <= 480){
    storyMaker.width = window.outerWidth;
    storyMaker.height = window.outerWidth;
    var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
    + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
    storyMaker.style['margin'] = storyMakerMarginText;
  }

  // Make canvas a fabric canvas
  return new fabric.Canvas(id, {preserveObjectStacking: true});
}

// Put all canvas code in a function so we can call it after google fonts have loaded
function setPlaceholderImgTemplate(canvas) {
  // canvas.backgroundColor = null;
  canvas.backgroundColor = 'black';
  var canvCenter = canvas.getCenter();
  // Loading placeholder image onto canvas
  var storyDraftImgSrc = document.getElementById('story-draftimg').getAttribute('value');
  if(storyDraftImgSrc != ''){
    document.getElementById('story-maker-next').classList.remove('inactive');
    var tempImg = storyDraftImgSrc;
  } else{
    var tempImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
  var backgroundObj;
  var backgroundImg = new Image();
  backgroundImg.onload = function () {
    backgroundObj = new fabric.Image(backgroundImg, {
      id: 'backgroundObj',
      left: canvCenter.left,
      top: canvCenter.top,
      originX: 'center',
      originY: 'center',
      borderColor: '#06538e',
      cornerSize: 12,
      transparentCorners: false
    });
    
    // Image - fit to canvas
    var imgWidth = backgroundObj.width;
    var imgHeight = backgroundObj.height;
    var canvasWidth = canvas.getWidth();
    var canvasHeight = canvas.getHeight();

    var imgRatio = imgWidth / imgHeight;
    var canvasRatio = canvasWidth / canvasHeight;
    if(imgRatio <= canvasRatio){
      if(imgHeight> canvasHeight){
        backgroundObj.scaleToHeight(canvasHeight);
      }
    }else{
      if(imgWidth> canvasWidth){
        backgroundObj.scaleToWidth(canvasWidth);
      }
    }
    canvas.add(backgroundObj);
    // This is like z-index, this keeps the image behind the text
    canvas.moveTo(backgroundObj, 0);
    var manual = false;
    cropCanvasTemplate(canvas, document.getElementById('story-draftimg').getAttribute('aspect_ratio'), manual);
  };
  backgroundImg.crossOrigin = 'anonymous';
  backgroundImg.src = tempImg;
}

function addImageTemplate(canvas, img) {
  document.getElementById('story-maker-next').classList.remove('inactive');
  document.getElementById('story-draftimg').setAttribute('is_edited', 'true');
  // Update image src - timeout added to fix image loading bug
  var backgroundObj = canvas.item(0);
  backgroundObj.setSrc(img, function () {
    var manual = false;
    fitImgAndTextToCanvas(canvas, manual)
    setTimeout(function(){ 
      canvas.requestRenderAll(); 
    }, 10);
  });
}

function cropCanvasTemplate(canvas, aspectRatio, manual) {
  document.getElementById('story-draftimg').setAttribute('aspect_ratio', aspectRatio);
  
  var x = Number(aspectRatio.split('_')[0]);
  var y = Number(aspectRatio.split('_')[1]);
  if((x == 4 && y == 3) || (x == 1 && y == 1) || (x == 3 && y == 4) || (x == 9 && y == 16)){
    var storyMaker = document.getElementById("story-maker");
    // BUG?!    ------------------>    Haven't checked yet, (- 4) adjustment is for 2px border
    var storyMakerContainerWidth = document.getElementById("story-maker-container").clientWidth - 4;
    var storyMakerContainerHeight = document.getElementById("story-maker-container").offsetHeight - 4;

    if(window.outerWidth > 768){
      canvas.setWidth((x/y)*0.625*window.outerHeight);
      canvas.setHeight(0.625*window.outerHeight);
      cropCanvasAndCenterImgAndText()
    } else if(window.outerWidth <= 768 && window.outerWidth > 480){
      if((x == 3 && y == 4)){
        canvas.setWidth(0.75*0.625*window.outerWidth);
        canvas.setHeight(0.75*0.625*(y/x)*window.outerWidth);
      } else if(x == 9 && y == 16){
        canvas.setWidth(0.5*0.625*window.outerWidth);
        canvas.setHeight(0.5*0.625*(y/x)*window.outerWidth);
      } else{
        canvas.setWidth(0.625*window.outerWidth);
        canvas.setHeight(0.625*(y/x)*window.outerWidth);
      }
      cropCanvasAndCenterImgAndText()
    } else if(window.outerWidth <= 480){
      if((x == 3 && y == 4)){
        canvas.setWidth(0.75*window.outerWidth);
        canvas.setHeight(0.75*(y/x)*window.outerWidth);
      } else if(x == 9 && y == 16){
        canvas.setWidth(0.625*window.outerWidth);
        canvas.setHeight(0.625*(y/x)*window.outerWidth);
      } else{
        canvas.setWidth(window.outerWidth);
        canvas.setHeight((y/x)*window.outerWidth);
      }
      cropCanvasAndCenterImgAndText()
    }

    function cropCanvasAndCenterImgAndText() {
      var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
      + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
      document.getElementsByClassName("upper-canvas")[0].style['margin'] = storyMakerMarginText;
      document.getElementsByClassName("lower-canvas")[0].style['margin'] = storyMakerMarginText;
      var canvCenter = canvas.getCenter();
      var backgroundObj = canvas.item(0);
      backgroundObj.left = canvCenter.left;
      backgroundObj.top = canvCenter.top;
      if(manual === true && canvas.item(1)){
        var textboxObj = canvas.item(1);
        textboxObj.left = canvCenter.left;
        textboxObj.top = canvCenter.top;
      }
      fitImgAndTextToCanvas(canvas, manual)
      canvas.requestRenderAll();
    }
  }
}

function fitImgAndTextToCanvas(canvas, manual) {
  var backgroundObj = canvas.item(0);
  var textboxObj = canvas.item(1);
  var imgWidth = backgroundObj.width;
  var imgHeight = backgroundObj.height;
  var canvasWidth = canvas.getWidth();
  var canvasHeight = canvas.getHeight();

  var imgRatio = imgWidth / imgHeight;
  var canvasRatio = canvasWidth / canvasHeight;
  if(imgRatio <= canvasRatio){
    if(imgHeight> canvasHeight){
      backgroundObj.scaleToWidth(canvasWidth);
      backgroundObj.scaleToHeight(canvasHeight);
      if(manual === true && canvas.item(1)){
        textboxObj.scaleToHeight(canvasHeight);
        textboxObj.scaleToWidth(canvasWidth);
      }
    } else{
      backgroundObj.scaleToWidth(canvasWidth);
      backgroundObj.scaleToHeight(canvasHeight);
      if(manual === true && canvas.item(1)){
        textboxObj.scaleToWidth(canvasWidth);
        textboxObj.scaleToHeight(canvasHeight);
      }
    }
  }else{
    if(imgWidth> canvasWidth){
      backgroundObj.scaleToHeight(canvasHeight);
      backgroundObj.scaleToWidth(canvasWidth);
      if(manual === true && canvas.item(1)){
        textboxObj.scaleToHeight(canvasHeight);
        textboxObj.scaleToWidth(canvasWidth);
      }
    } else{
      backgroundObj.scaleToHeight(canvasHeight);
      backgroundObj.scaleToWidth(canvasWidth);
      if(manual === true && canvas.item(1)){
        textboxObj.scaleToWidth(canvasWidth);
        textboxObj.scaleToHeight(canvasHeight);
      }
    }
  }
}

function addTextBoxTemplate(canvas) {
  document.getElementById('story-maker-next').classList.remove('inactive');
  document.getElementById('story-draftimg').setAttribute('is_edited', 'true');
  var canvCenter = canvas.getCenter();
  // Load text onto canvas
  var textboxObj = new fabric.Textbox('', {
    id: 'textboxObj',
    left: canvCenter.left,
    top: canvCenter.top,
    originX: 'center',
    originY: 'center',
    width: 0.75*canvas.width,
    fontSize: 28,
    fill: '#fff',
    fontFamily: 'Open Sans',
    fontWeight: 800,
    textAlign: 'center',      
    borderColor: '#06538e',
    padding: 4,
    cornerSize: 12,
    transparentCorners: false,
    lockRotation: true
  });
  textboxObj.setControlsVisibility({
    mtr: false, 
  });
  // Add shadow to the textbox with this line
  textboxObj.set('shadow', new fabric.Shadow("0px 0px 10px rgba(0, 0, 0, 1)"));
  canvas.add(textboxObj);
}

function clearCanvasTemplate(canvas) {
  canvas.remove(canvas.item(1));
}

// dataURLtoBlob function for saving
function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

//Sending image data to server
function sendImageDraftToServer(imgData, type, aspectRatio, clubId, csrfToken){
  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/clubs/'+ clubId +'/story/create/draft', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-CSRF-Token', csrfToken);
  xhr.send(JSON.stringify({image: imgData, type, aspectRatio}));
  xhr.onloadend = function() {
    if(xhr.status == 200) {
      return location.replace('/clubs/'+ clubId +'/story/create/options');
    }
  }
}