/*
 File: HW6/js/add-content.js
 Full name: Yassir Kanane
 COMP 4601 Assignment 7
 Yassir Kanane, UMass Lowell Computer Science, yassir_kanane@student.uml.edu
 Updated on Dec. 1, 2019 at 3:47 PM */



 //function to identify source and target ids: https://stackoverflow.com/questions/3943868/jquery-drag-and-drop-find-the-id-of-the-target
 function handleDropEvent(event, ui) {
   console.log('Dropped ' + ui.draggable.attr('id') + ' onto ' + event.target.id);
 }
 //https://jqueryui.com/draggable/#visual-feedback
 $( function() {

     var tiles = $.getJSON("../pieces.json");
     $( "#draggable" ).draggable({
       connectToSortable: "#sortable",
       helper: "clone",
       revert: "valid"
     });
     $( "#draggable2" ).draggable({
       revert: "invalid",
       snap: ".dropLoc #tileRack"
     });
     $( "#draggable3" ).draggable({
       revert: "invalid",
       snap: "dropLoc"
     });

     $("#tileRack").droppable({
       drop:handleDropEvent
     })

     $("#slot-1").droppable({
       drop: handleDropEvent
     })


     $( "ul, li" ).disableSelection();
   } );
