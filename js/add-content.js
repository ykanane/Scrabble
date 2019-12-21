/*
 File: HW6/js/add-content.js
 Full name: Yassir Kanane
 COMP 4601 Assignment 9
 Yassir Kanane, UMass Lowell Computer Science, yassir_kanane@student.uml.edu
 Updated on Dec. 20, 2019 at 3:47 PM */



 $(function() {
     var tilePool = [];
     var currentRack = [];
     var tilesOnBoard = [];
     var remainingTiles;
     var missingHandTiles;
     var currentTileID = 0
     var doubleWordFlag = false;
     var currentScore = 0;
     var totalScore = 0;

     $.get("https://ykanane.github.io/Scrabble/pieces.json")
     .done(function(response) {
       tileJSON = response.pieces;
       initializeGame();
       console.log(currentRack);
     });


     //Learned about droppable options from this: https://api.jqueryui.com/droppable/#option-tolerance
     $("#innerRack").droppable({
       tolerance: "fit"
     })

     //Configure tile boards droppable options
     $("#tileBoard div").droppable({
       tolerance: "pointer",
       drop: handleDropEvent,
       out: handleTileRemoved
     })

     //This function calls the core functions to start the game initially after JSON is read
     function initializeGame(){
       fillTilePool();
       initializeRackTiles();
       addTilesToRack(true);
     }

     //initialize the pool of tile with all duplicates included
     function fillTilePool(){
       for(i = 0; i < 27; i++){
         var currentTile = tileJSON[i];
         for(k = 0; k < currentTile.amount; k++){
           tilePool.push(currentTile);
         }
       }
     }

     //Worked with Justin Lagree on this, this function adds tiles to the rack and updates the remaining tiles
     function initializeRackTiles(){
       remainingTiles = (tilePool.length < 7) ? tilePool.length : 7; //check when there are less than 7 tiles left
       if(remainingTiles == 0){ //if no tiles left, let the user know
         alert("Sorry, there are no tiles remaining");
         return;
       }
       for(i = 0; i < remainingTiles; i++){
         var rand = Math.trunc(Math.random() * tilePool.length); //trunc turns into int
          currentRack.push(tilePool[rand]); //add tile to rack
          tilePool.splice(rand, 1); //remove tile from tile pool
       }
       $("#tiles-remaining").text("Tiles Remaining: " + tilePool.length) //update remaining tile html
     }

     //this function is used to keep track of the total score throughout the game
     function calculateScore(){
       if(doubleWordFlag){ //reset the double word flag for next blank board
          doubleWordFlag = false;
       }
       var $totalscore = $("#total-score");
       var newScore = parseInt($totalscore.attr("currentscore")) + currentScore;
       $totalscore.attr("currentscore", newScore); //update the "currentscore" attribute that holds the score so far
       $totalscore.text("Total Score: " + newScore);
     }

     //Function to revert tiles back to rack if dropped in an invalid area
     //Got this from: https://stackoverflow.com/questions/5735270/revert-a-jquery-draggable-object-back-to-its-original-container-on-out-event-of
     function reverToRack(event, ui){
         $(this).data("ui-draggable").originalPosition = {
               top : 0,
               left : 0
           };
           return !event;
     }

    //This function is to remove points when a tile is removed from the board
    function removePoints($letterTile, $boardTile){
       var $currScore = $("#score");
       //Check if tile removed was a double word, and decrease score appropriately
       if($boardTile.attr("class") == "doubleWord ui-droppable ui-droppable-active"){
           if(doubleWordFlag == true){
             currentScore /= 2;
           }
           doubleWordFlag = false;
           currentScore -= ($letterTile.attr("points") * $boardTile.attr("multiplier"));
           $currScore.text("Current Word Score: " + "+" + currentScore);
       }
       else{ //Decrease score based on tile removed
           var letterScore =  $letterTile.attr("points") * $boardTile.attr("multiplier");
           if(doubleWordFlag){
               currentScore -= letterScore * 2;
               $currScore.text("Current Word Score: " + "+" + currentScore);
           }else{
               currentScore -= letterScore;
               $currScore.text("Current Word Score: " + "+"  + currentScore);
           }
         }
         console.log("test", doubleWordFlag);
     }

     //This function to add points to the current score based on the letter tile dropped
     function addPoints($letterTile, $boardTile){
         var $currScore = $("#score");
         //Check if board tile is a double word tile and update score accordingly
         if($boardTile.attr("class") == "doubleWord ui-droppable"){
           if(doubleWordFlag == false){
             currentScore *= 2;
           }
           doubleWordFlag = true;
           currentScore += ($letterTile.attr("points") * $boardTile.attr("multiplier")) * 2;
           $currScore.text("Current Word Score: " + "+" + currentScore);
         }
         else{
           var letterScore =  $letterTile.attr("points") * $boardTile.attr("multiplier");
           if(doubleWordFlag){
               currentScore += letterScore * 2;
               $currScore.text("Current Word Score: " + "+" + currentScore);
             }
           else{
               currentScore += letterScore;
               $currScore.text("Current Word Score: " + "+" + currentScore);
           }
         }
     }

     //This function handles the score when a tile is removed from the board
     function handleTileRemoved(event,ui){
         //console.log('Removed' + ui.draggable.attr('id') + ' from ' + event.target.id);
         var $this = $(this);
         var draggableId = ui.draggable.attr("id");
         var droppableId = $(this).attr("id");
         var $currScore = $("#score");
         //console.log('Dropped ' + draggableId + ' onto ' + droppableId);
         console.log(tilesOnBoard);
         //console.log(doubleWordFlag);
         //console.log($(this).find("ui-draggable"))
         if(tilesOnBoard.includes(ui.draggable.attr("id"))){ //if tile is not on board, dont subtract
           var boardIndex = tilesOnBoard.indexOf(ui.draggable.attr('id'));
           tilesOnBoard.splice(boardIndex,1);
           console.log(tilesOnBoard + " inside tileRemoved");
           $(this).attr("used", 0);
           $(this).attr("letter", -1);
           removePoints(ui.draggable, $(this));
           updateWord();
        }
     }//End handleTileRemoved function

     //This function handles all interactions when a tile is dropped onto the tileboard, utilizing helper functions to properly mantain score, current word, remaining tiles
     //Learned about identifying source and target ids here: https://stackoverflow.com/questions/3943868/jquery-drag-and-drop-find-the-id-of-the-target
     function handleDropEvent(event, ui) {
         var $this = $(this);
         var draggableId = ui.draggable.attr("id");
         var draggableLetter = ui.draggable.attr("letter");
         var currentWord = "";
         var droppableId = $(this).attr("id");
         var $currScore = $("#score");
         console.log('Dropped letter ' + draggableLetter + ' with ID: ' + draggableId + ' onto ' + droppableId);

         if(!tilesOnBoard.includes(ui.draggable.attr("id"))){ //if tile is already on board dont calculate
             if($(this).attr("used") == 1){ //if tile is used dont add score
                 ui.draggable.draggable('option','revert', reverToRack);
                 ui.draggable.animate(ui.draggable.data().origPosition= {
                    top : 0,
                    left : 0
                 },"slow");
             return;
           }
           if(ui.draggable.attr("letter") == "Blank"){
             createBlankTileDialog(ui.draggable, $(this));
           }else{
             $(this).attr("letter", draggableLetter);
           }
           tilesOnBoard.push(ui.draggable.attr("id"));
           $(this).attr("used", 1);
           addPoints(ui.draggable, $(this));

         }
         updateWord();

         //Learned about snapping to center from: https://stackoverflow.com/questions/26746823/jquery-ui-drag-and-drop-snap-to-center
         ui.draggable.position({
           my: "center",
           at: "center",
           of: $this,
           using: function(pos) {
             $(this).animate(pos, 200, "linear");
           }
         });
     } //End handleDropEvent function

     //This function is used to update the current word as the user plays
     function updateWord(){
       var currentWord = " ";
       //update the current word by parsing board tiles
       $("#tileBoard div").each(function(index,$el){
         if($el.getAttribute("letter") != -1){
           currentWord += $el.getAttribute("letter");
         }
       });
       $("#current-word").text("Current Word: " + currentWord);
     }

     //Function to handle only adding tiles required for full hand of 7 after word is submitted
     function fillRackForNextHand(){
       remainingTiles = (tilePool.length < 7) ? tilePool.length : 7; //check when there are less than 7 tiles left
       if(remainingTiles == 0){ //if no tiles left, let the user know
         alert("Sorry, there are no tiles remaining");
         return;
       }
       if(currentRack.length < 7){  //check if rack isnt completely empty for case where a word was played successfully
           missingHandTiles = 7 - currentRack.length;
           console.log("missing" + missingHandTiles);
           for(i = 0; i < missingHandTiles; i++){
             var rand = Math.trunc(Math.random() * tilePool.length); //Trunc converts rand into int
              currentRack.push(tilePool[rand]); //add tile to rack
              tilePool.splice(rand, 1); //remove tile from tile pool
           }
           $("#tiles-remaining").text("Tiles Remaining: " + tilePool.length) //update tiles remaining
           addTilesToRack(false);
       }
     }

     //create tile html elements and append them to tile rack
     function addTilesToRack(resetFlag){
        if(resetFlag){
          for(i = 0; i < currentRack.length; i++){
            var newTileImage = document.createElement("img");
            newTileImage.setAttribute('src', "images/Tile_" + currentRack[i].letter + ".jpg");
            newTileImage.setAttribute('points' , currentRack[i].value); // assign points to the image
            newTileImage.setAttribute('id', "tile" + currentTileID++);
            newTileImage.setAttribute("index", i);
            newTileImage.setAttribute("letter", currentRack[i].letter);
            newTileImage.classList.add("ui-widget-content");
            $("#innerRack").append(newTileImage);
          }
        }
        else {
          for(i = currentRack.length - missingHandTiles; i < 7; i++){
            var newTileImage = document.createElement("img");
            newTileImage.setAttribute('src', "images/Tile_" + currentRack[i].letter + ".jpg");
            newTileImage.setAttribute('points' , currentRack[i].value); // assign points to the image
            newTileImage.setAttribute('id', "tile" + currentTileID++);
            newTileImage.setAttribute("index", i);
            newTileImage.setAttribute("letter", currentRack[i].letter);
            newTileImage.classList.add("ui-widget-content");
            $("#innerRack").append(newTileImage);
          }
        }

        //Set tiles to be draggable, modify css, and configure draggable settings. Learned about this from: https://api.jqueryui.com/draggable/#option-snapMode
       $("#innerRack img").draggable({
          revert: reverToRack,
          snap: ".ui-droppable",
          refreshPositions: true,
          snapTolerance: "3",
          snapMode: "both",
          stack: ".ui-draggable",
          stop: function(){
                 $(this).draggable('option','revert', reverToRack);
                }
         }).css({
           width: "75px",
           height: "75px",
           marginBottom: "20px"
         }).droppable({  //prevent user from placing letter tiles on top of eachother, learned about this from: https://stackoverflow.com/questions/6071409/draggable-revert-if-outside-this-div-and-inside-of-other-draggables-using-both
            greedy: true,
            tolerance: 'pointer',
            drop: function(event,ui){
                      ui.draggable.animate(ui.draggable.data().origPosition= { top : 0, left : 0 },"slow"); //set the dragged tile to always revert
                        // Display error toast message for a few seconds
                      var message = document.getElementById("snackbar");
                      message.className = "show";
                     setTimeout(function(){ message.className = message.className.replace("show", ""); }, 4000);
                  }
         });
     } //end addTilesToRack function

     //Function to create the dialog when a blank tile is placed on the board
     //I got this idea from looking at the example posted on piazza: http://yongcho.github.io/GUI-Programming-1/assignment9.html
     function createBlankTileDialog(blankTile, boardTile){
        var tileDialog = $('<div></div>');
        tileDialog.attr('id', 'tileDialog');
        tileDialog.attr('title', 'Click on a letter.')
        //Add each letter image from JSON to dialog options, and set the board tile and tile letter attribute
        // to the new letter so the word updates properly
        tileJSON.forEach(element => {
          if(element.letter != 'Blank'){
            var tileInDialog = document.createElement("img");
            tileInDialog.setAttribute('src', "images/Tile_" + element.letter + ".jpg");
            tileInDialog.setAttribute('letter', element.letter);
            tileInDialog.classList.add("blankTileLetters");
            tileInDialog.onclick = function() {
              blankTile.attr("letter", tileInDialog.getAttribute("letter"));
              blankTile.attr('src', tileInDialog.getAttribute("src"));
              tileDialog.dialog("close");
              boardTile.attr('letter', tileInDialog.getAttribute("letter"));
              updateWord();
           };
         } //end if
        tileDialog.append(tileInDialog);
      });//end for each
      //Set as dialog and configure dialog settings: https://api.jqueryui.com/dialog/
      tileDialog.dialog({
             classes: {"ui-dialog":"no-close"},
             modal: true,
             draggable: false,
             resizable: false
      });
     }


     //Fill hand back up to 7 tiles on next word
     $( "#next-word" ).click(function() {
       tilesOnBoard.forEach(element => {
         console.log(element);
         $("#" + element).remove(); //remove image of tiles on the board from screen
         currentRack.splice(element.index, 1); //remove tile from rack
       });
       //clear board tile letter values
       $("#tileBoard div").each(function(index,$el){
         $el.setAttribute("letter", -1);
       });
       tilesOnBoard = []; //reset board
       fillRackForNextHand();
       calculateScore(); //add current score to the total score
       currentScore = 0; //reset current word score
       $("#score").text("Current Word Score: " + currentScore); //reset current word score html
       $("#current-word").text("Current Word: ");
       $("#tileBoard div").attr("used", 0);  //set all board tiles to unused after word is submitted
    })

      //Button on click  function to distribute random 7 new letter tiles if player gets stuck
     $( "#reset-tile" ).click(function() {
       currentRack = [];
       tilesOnBoard = []; //reset board
       totalScore = 0;
       currentScore = 0
       $("#tileBoard div").each(function(index,$el){
         $el.setAttribute("letter", -1);
       });
       $("#innerRack img").remove();
       initializeRackTiles();
       addTilesToRack(true);
    })

    //Reset all game variables and start and new game
    $( "#new-game" ).click(function() {
      currentRack = [];
      tilesOnBoard = []; //reset board
      tilePool = [];
      totalScore = 0;
      currentScore = 0
      $("#tileBoard div").each(function(index,$el){
        $el.setAttribute("letter", -1);
      });
      $("#score").text("Current Word Score: " + currentScore);
      $("#total-score").text("Total Score: " + totalScore);
      $("#total-score").attr("currentscore", 0);
      $("#innerRack img").remove();
      $("#tileBoard div").attr("used", 0);  //set all board tiles to unused after word is submitted
      $("#current-word").text("Current Word: ");
      initializeGame();
      console.log(currentRack);
   })

   //Refill tile pool back to 100 if the user wants to cheat and play forever
   $( "#refill-pool" ).click(function() {
     tilePool = [];
     fillTilePool();
     $("#tiles-remaining").text("Tiles Remaining: " + tilePool.length) //update remaining tile html
     console.log(currentRack);
  })

}); //end document ready function
