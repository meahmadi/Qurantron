$(function(){

  const ipc = require('electron').ipcRenderer;

  ipc.send('loadTree');

  // Create the tree inside the <div id="tree"> element.
  $("#tree").fancytree({
      extensions: ["edit"],
      init: function(event, data){
        // Set RTL attribute on init
        $(this).find(".fancytree-container").attr("DIR", "RTL").addClass("fancytree-rtl");
      },
      keydown: function(event, data) {
        var KC = $.ui.keyCode,
          oe = event.originalEvent;

        // Swap LEFT/RIGHT keys
        switch( event.which ) {
        case KC.LEFT:
          oe.keyCode = KC.RIGHT;
          oe.which = KC.RIGHT;
          break;
        case KC.RIGHT:
          oe.keyCode = KC.LEFT;
          oe.which = KC.LEFT;
          break;
        }
      },
      edit: {
        triggerStart: ["f2", "dblclick", "shift+click", "mac+enter"],
        beforeEdit: function(event, data){
          // Return false to prevent edit mode
        },
        edit: function(event, data){
          // Editor was opened (available as data.input)
        },
        beforeClose: function(event, data){
          // Return false to prevent cancel/save (data.input is available)
        },
        save: function(event, data){
          // Save data.input.val() or return false to keep editor open
          console.log("save...", this, data);
          // Simulate to start a slow ajax request...
          setTimeout(function(){
            $(data.node.span).removeClass("pending");
            // Let's pretend the server returned a slightly modified
            // title:
            data.node.setTitle(data.node.title);
          }, 2000);
          // We return true, so ext-edit will set the current user input
          // as title
          return true;
        }
      },

      source: {
                url: "http://www.itis.gov/ITISWebService/jsonservice/getKingdomNames",
                data: {
                  jsonp: "itis_data"
                },
                cache: true,
                jsonpCallback: "itis_data",
                dataType: "jsonp"
              },
              lazyLoad: function(event, data) {
                data.result = {
                  url: "http://www.itis.gov/ITISWebService/jsonservice/getHierarchyDownFromTSN",
                  // url: "http://www.itis.gov/ITISWebService/jsonservice/getCommonNamesFromTSN",
                  data: {
                    jsonp: "itis_data",
                    tsn: data.node.key
                  },
                  cache: true,
                  jsonpCallback: "itis_data",
                  dataType: "jsonp"
                };
              },
              postProcess: function(event, data) {
                var response = data.response;

                data.node.info(response);
                switch( response.class ) {
                case "gov.usgs.itis.itis_service.metadata.SvcKingdomNameList":
                  data.result = $.map(response.kingdomNames, function(o){
                    return o && {title: o.kingdomName, key: o.tsn, folder: true, lazy: true};
                  });
                  break;
                case "gov.usgs.itis.itis_service.data.SvcHierarchyRecordList":
                  data.result = $.map(response.hierarchyList, function(o){
                    return o && {title: o.taxonName, key: o.tsn, folder: true, lazy: true};
                  });
                  break;
                default:
                  $.error("Unsupported class: " + response.class);
                }
              }
   });
});
