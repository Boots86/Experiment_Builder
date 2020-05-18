const gameTableHTML = document.getElementById("game-table");
const modeSelect = document.getElementById("mode-setting");
const newCellClassName = "new-cell";
const cellIDName = "game-cell-id-";
const flagClassName = "cell-flag";

const setupGame = () => {
    CONFIG.currentMode = modeSelect.value;
    const gameMode = getCurrentGameMode(),
          gameModeBombs = gameMode.bombs,
          gameSize = gameMode.size,
          gameSizeRows = gameSize.rows,
          gameSizeCols = gameSize.cols;
    
    
    
    //Genterate bomb locations
    const bombCells = [];
    let cellBombID, maxLoops = 10000;
          
    while(bombCells.length < gameModeBombs && maxLoops >0){
        cellBombID = Math.floor(Math.random()*(gameSizeRows*gameSizeCols)) + 1;
        if(bombCells.indexOf(cellBombID)===-1) bombCells.push(cellBombID);
        maxLoops --;
    }
    CONFIG.bombLocations = bombCells;
    
    //Build Rows
    gameTableHTML.innerHTML = "";
    let i, j, row, col, cellID, bombsAroundCell, cellSpan, cellContent;
          
    for(i = 0; i < gameSizeRows; i++) {
        row = gameTableHTML.insertRow(i);
        
        //start at 1 for 0-100 and <= to include all nuimbers and j-1 so that it can start with index of 0
        for(j = 1; j <= gameSizeCols; j++) {
            col = row.insertCell(j - 1);
            col.classList.add(newCellClassName);
            col.setAttribute("row", i);
            col.setAttribute("col", j);
            
            cellID = makeCellID(i, j);
            col.id = cellIDName + cellID;
            
            //clear cells first
            cellContent = "";
            //add an x to bomb cells
            if(bombCells.indexOf(cellID) > -1) {
                cellContent = "x";
                col.setAttribute("hasBomb", 1);
                
            } else {
                bombsAroundCell = 0;
                getCellIDsAround(i, j).map(aroundCellID => {
                    //ignoring the cell containing the bomb
                    if(bombCells.indexOf(aroundCellID) > -1) bombsAroundCell ++;
                });
                
                //Show numbers around bombs no 0
                if(bombsAroundCell) cellContent = bombsAroundCell;
                col.setAttribute("bombsAroundCell", bombsAroundCell);
            }
            
            cellSpan = document.createElement("span");
            cellSpan.classList.add("cell-content");
            cellSpan.innerHTML = cellContent;
            
            //append cellSpan to td
            col.appendChild(cellSpan);
        }
    }
    
    CONFIG.gamePlayable = true;
    setBombsRemaining();
    timerControl("start");
};

const getCellIDsAround = (row, col) => {
    
    //Loop Rows and Cols around bombs
    const gameMode = getCurrentGameMode(),
          gameModeRows = gameMode.size.rows,
          gameModeCols = gameMode.size.cols,
          maxRows = row+2,
          maxCols = col+2,
          aroundCellIDs = [];
    
    let i, j, newCellID;
    for(i = row - 1; i < maxRows; i++){
        for (j = col - 1; j < maxCols; j++){
            newCellID = makeCellID(i, j);
            if(i >= 0 && 
               i < gameModeRows && 
               j > 0 && 
               j <= gameModeCols && 
               makeCellID(row,col) !== newCellID) aroundCellIDs.push(newCellID);
        }
    }
    return aroundCellIDs;
};

const makeCellID = (row, col) => {
    const gameMode = getCurrentGameMode();
    return row * gameMode.size.cols + col;
};

const getCurrentGameMode = () => {
    return CONFIG.mode[CONFIG.currentMode];
};

//10 = 0xa in hexidecimal
const newCellClicked = (cell, isRightBtn) => {
    const row = parseInt(cell.getAttribute("row"), 0xa), 
          col = parseInt(cell.getAttribute("col"), 0xa),
          hasBomb = parseInt(cell.getAttribute("hasBomb"), 0xa)===1,
          bombsAroundCell = parseInt(cell.getAttribute("bombsAroundCell"), 0xa);
    
    
    //right click (mark as bomb - flag)
    if(isRightBtn === true) {
        
        const markedAsBomb = parseInt(cell.getAttribute("markedAsBomb"), 0xa)===1;
        
        cell.setAttribute("markedAsBomb", markedAsBomb ? 0 : 1);
        
        if(markedAsBomb) {
            //unmark flag
            const removeFlagImage = cell.getElementsByClassName(flagClassName);
            cell.removeChild(removeFlagImage[0]);  
        } else {
            //add flag
            const flagImage = document.createElement("IMG");
            flagImage.setAttribute("src", "images/clue.svg");
            flagImage.setAttribute("width", "100%");
            flagImage.setAttribute("height", "100%");
            flagImage.setAttribute("alt", "Flag");
            flagImage.classList.add(flagClassName);
            cell.appendChild(flagImage);
            cell.setAttribute("hasFlag", 1);
        }
        setBombsRemaining();
        
        
        
    }else {
       //lose game
        if(hasBomb) {
            timerControl();//stop timer
            alert("You didn't have enough information to start working on your experiment, you can do some more research and try again.");

            //Show all bombs
            CONFIG.bombLocations.map(cellID => {
                cell = document.getElementById(cellIDName + cellID);
                bombImage = document.createElement("IMG");
                bombImage.setAttribute("src", "images/research.svg");
                bombImage.setAttribute("width", "100%");
                bombImage.setAttribute("height", "100%");
                bombImage.setAttribute("alt", "Bomb");
                bombImage.classList.add(flagClassName);
                cell.innerHTML = "";
                cell.appendChild(bombImage);
                cell.setAttribute("hasFlag", 0);
            });
            CONFIG.gamePlayable = false;
            return;
    }
    
        //show content
        cell.classList.remove(newCellClassName);

        //if blank cell
        if(bombsAroundCell === 0) {
            //click around each square
            getCellIDsAround(row, col).map(aroundCellID => {
                let cellToClick;

                //click
                cellToClick = document.getElementById(cellIDName + aroundCellID);
                if(cellToClick && cellToClick.matches("." + newCellClassName) && parseInt(cellToClick.getAttribute("hasFlag"),0xa)!==1){
                    newCellClicked(cellToClick);
                }
            });
        } 
    }
    
    //Win game check
    const bombLocations = CONFIG.bombLocations,
          currentMarkedBombsIDs = currentMarkedBombs();
          //unclickCells = , gameTableHTML.getElementsByClassName(newCellClassName).length - gameTableHTML.getElementsByClassName(flagClassName).length;
    //add to if statement below for all cells cleared check (unclickCells === 0 &&) 
    if(bombLocations.length === currentMarkedBombsIDs.length) {
        //validate marked bombs
        let foundBombsCorrect = 0;
        currentMarkedBombsIDs.map(cellID => {
            if(bombLocations.indexOf(cellID) > -1) foundBombsCorrect++;
        });
        if(foundBombsCorrect === bombLocations.length) {
            //game won
            alert("Great work, you are now ready to do an experiment");
            timerControl(); //stop timer
            CONFIG.gamePlayable = false;
        }    
    }
};

const currentMarkedBombs = () => {
    const currentMarkedCells = gameTableHTML.getElementsByClassName(flagClassName),
          totalMarkedCells = currentMarkedCells.length;
    
    let i, cell, row, col, currentMarkedIds = [];
    for(i = 0; i < totalMarkedCells; i++){
        cell = currentMarkedCells[i].parentNode;
        currentMarkedIds.push(makeCellID(parseInt(cell.getAttribute("row"), 0xa), parseInt(cell.getAttribute("col"), 0xa)));
    }
    return currentMarkedIds;
};

const setBombsRemaining = () => {
    document.getElementById("game-bombs-remaining").innerHTML = CONFIG.bombLocations.length - currentMarkedBombs().length;
};

const timerHTML = document.getElementById("game-timer");
let timerInterval, 
    timerTime = 0;
const timerControl = action => {
    clearInterval(timerInterval);
    if(action === "start"){
      //start timer
        timerTime = 0;
        timerInterval = setInterval(() => {
            timerTime++;
            timerHTML.innerHTML = timerTime;
        }, 1000);
    }    
};
    

(() => {
    //Build Select Options
    let option;
    Object.keys(CONFIG.mode).forEach(modeKey => {
        option = document.createElement("option");
        option.value = modeKey;
        option.text = CONFIG.mode[modeKey].name;
        modeSelect.add(option);        
    }); 
    
    setupGame();
    
    //listen for clicks on game table
    gameTableHTML.onmousedown = e => {
        e = e || window.event;
        
        if(!CONFIG.gamePlayable) return;
         
        let target = e.target,
            isRightBtn, 
            unmarkFlag;
        
        if("which" in e) {
            //firefox, Webkit, Opera
            isRightBtn = e.which === 3;
        } else if("button" in e) {
            //IE, Opera
            isRightBtn = e.button === 2;
        }
        
        //right click on flag
        unmarkFlag = target.matches("." + flagClassName) && isRightBtn;
        if(unmarkFlag) target = target.parentNode;
        
        //Clicked on cell
        if(target.matches("." + newCellClassName) || unmarkFlag) {
            //process clicked cell
            newCellClicked(target, isRightBtn);
        }
        
        //right click for bomb marker
        gameTableHTML.oncontextmenu = () => {
            return false;
        }
        
    }
})();