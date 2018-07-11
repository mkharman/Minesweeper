'use strict';
console.log('Game Logic');

setTimeout(function () { alert('Please choose game difficulty') }, 1000);

// Global variable for the game timer
var gInterval;

var AUDIO_LOSE = new Audio('sound/Evil_laugh_Male.mp3');
var AUDIO_WIN = new Audio('sound/Cheering.mp3')

// Global variable for holding the board's size and number of mines in the board
var gLevel = {
    SIZE: 0,
    MINES: 0
};

// Global variable for holding the game's data, including number of revealed cells and flagged cells
var gState = { isGameOn: false, shownCount: 0, markedCount: 0};

// Global variable for handling the mouse event, whether it's a left click or a right click
var gMouseButton;

var gBoard

function initGame() {
    gState.isGameOn = true;
    gLevel.SIZE = getRadioButtonValue();
    gLevel.MINES = getMinesCount(gLevel.SIZE);
    gBoard = buildBoard(gLevel.SIZE, gLevel.MINES);
    console.table(gBoard);

    gBoard = setMinesNegs(gBoard);

    renderBoard(gBoard);
    activateTimer();
}

// Function for determining the number of mines, according to the board's size
function getMinesCount(size) {
    switch (size) {
        case 4: return 2;
            break;
        case 6: return 5;
            break;
        case 8: return 15;
            break;
    }
}

// Function for getting the radio buttons value from HTML elements
function getRadioButtonValue() {
    var radios = document.getElementsByName('difficulty');
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) return parseInt(radios[i].value);
    }
}

// Initial function for building the board data before rendering it to HTML elements on the screen
// parameter: size - size of the board
// parameter: mineCount - number of mines in the board
function buildBoard(size, mineCount) {

    // Creating the board as an empty one
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = createCell('empty', false, '');
        }
    }

    // Assigning mines to random cells in the board
    for (var z = 0; z < mineCount; z++) {

        // X and Y stand for the X-axis and Y-axis, respectively
        // This is valid for the rest of the program
        var xIndex = getRandomInt(0, size - 1);
        var yIndex = getRandomInt(0, size - 1);
        var cell = board[xIndex][yIndex];

        if (!cell.isMine) {
            cell.name = 'mine-' + xIndex + '-' + yIndex;
            cell.isMine = true;
            cell.content = '☠';
        }
        else z--;

        console.log(xIndex);
        console.log(yIndex);
    }

    return board;
}

function createCell(name, isMine, content) {
    return {
        name: name,
        isMine: isMine,
        content: content
    }
}

function setMinesNegs(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var currentCell = board[i][j];
            if (!currentCell.isMine) {
                var tempCell = updateCell(board, i, j);
                if (tempCell) board[i][j] = tempCell;
            }
        }
    }

    return board;
}

function updateCell(board, xIndex, yIndex) {
    var negMinesCount = getNegMinesCount(board, xIndex, yIndex);
    if (negMinesCount > 0) {
        var cellName = 'number-' + xIndex + '-' + yIndex;
        return createCell(cellName, false, negMinesCount);
    }
    else {
        var cellName = 'empty-' + xIndex + '-' + yIndex;
        return createCell(cellName, false, '');
    }
}

function getNegMinesCount(board, xIndex, yIndex) {
    var negMinesCount = 0;

    for (var i = xIndex - 1; i <= xIndex + 1; i++) {
        if (!(i >= 0 && i < board.length)) continue;
        for (var j = yIndex - 1; j <= yIndex + 1; j++) {
            // If middle cell or out of mat - continue;
            if ((i === xIndex && j === yIndex) ||
                (j < 0 || j >= board.length)) continue;

            var currentCell = board[i][j];
            if (currentCell.isMine) negMinesCount++;
        }
    }
    return negMinesCount;
}

function renderBoard(board) {
    var strHtml = '';

    // Get the reference for the body
    var elBoard = document.querySelector('.board');

    // Creating rows
    for (var row = 0; row < board.length; row++) {
        strHtml += '<tr>';

        // Create cells in row
        for (var col = 0; col < board.length; col++) {
            var cell = board[row][col];
            var cellContent = cell.content;
            var cellName = cell.name;
            var className;
            if (cell.name.includes('empty')) className = 'empty';
            else className = (!cell.isMine) ? ('number' + cell.content) : 'mine';
            strHtml += '<td name="' + cellName +
                '" class="' + className + '" ' + '' +
                'onmousedown="whichButton(this, event)" onclick="cellClicked(this, ' + row + ', ' + col + ')">';
            strHtml += '<span>' + cell.content + '</span>';
            strHtml += '</td>';
        }

        // Add the row to the end of the table body
        strHtml += '</tr>';
    }

    elBoard.innerHTML = strHtml;
}

function whichButton(elCell, event) {
    gMouseButton = event.button;
    if (gMouseButton === 2) cellMarked(elCell);
}

function cellClicked(elCell, i, j) {
    // Get the child element of <td>, which in this case is <span>
    var childElement = elCell.childNodes[0];
    var innerContent = childElement.innerHTML;

    if (gMouseButton === 0 && innerContent !== '🚩') {
        elCell.classList.add('marked');
        var cellName = elCell.getAttribute('name');
        childElement.style.display = 'initial';
        gState.shownCount++;
        checkGameOver();

        if (cellName.includes('mine')) {
            AUDIO_LOSE.play();
            clearInterval(gInterval);
            gInterval = undefined;
            gState.markedCount = 0;
            gState.shownCount = 0;
            setTimeout(function () { alert('You clicked on a mine, you lost!'); }, 200);
        }
        else if (cellName.includes('empty')) {
            expandShown(gBoard, elCell, i, j);
        }
        console.log(elCell);
    }
}

function expandShown(board, elCell, xIndex, yIndex) {

    for (var i = xIndex - 1; i <= xIndex + 1; i++) {
        if (!(i >= 0 && i < board.length)) continue;
        for (var j = yIndex - 1; j <= yIndex + 1; j++) {
            // If middle cell or out of mat - continue;
            if ((i === xIndex && j === yIndex) ||
                (j < 0 || j >= board.length)) continue;

            var currentCell = board[i][j];
            var elCurrentCell = document.getElementsByName(currentCell.name)[0];
            var cellClass = elCurrentCell.getAttribute('class');

            if (!cellClass.includes('marked') && !cellClass.includes('flagged')) {
                var childElement = elCurrentCell.childNodes[0];
                switch (currentCell.content) {
                    case '': elCurrentCell.classList.add('marked');
                        childElement.style.display = 'initial';
                        expandShown(board, elCurrentCell, i, j);
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7: elCurrentCell.classList.add('marked');
                        childElement.style.display = 'initial';
                        gState.shownCount++;
                        break;
                }
            }
        }
    }
}

function cellMarked(elCell) {

    // Jquery fucntion to disable to the context menu when doing a right click
    $('td').bind('contextmenu', function (e) {
        return false;
    });

    var cellClass = elCell.getAttribute('class');
    var childElement = elCell.childNodes[0];
    var innerContent = childElement.innerHTML;

    if (!cellClass.includes('marked')) {
        if (innerContent !== '🚩') {
            elCell.classList.add('flagged');
            childElement.innerHTML = '🚩';
            childElement.style.display = 'initial';
            gState.markedCount++;
        }
        else if (cellClass.includes('number')) {
            elCell.classList.remove('flagged');
            var content = cellClass.substring(6, 7);
            childElement.innerHTML = content;
            childElement.style.display = 'none';
            gState.markedCount--;
        }
        else if (cellClass.includes('empty')) {
            elCell.classList.remove('flagged');
            childElement.innerHTML = '';
            childElement.style.display = 'none';
            gState.markedCount--;
        }
        else {
            elCell.classList.remove('flagged');
            childElement.innerHTML = '☠';
            childElement.style.display = 'none';
            gState.markedCount--;
        }
    }

    checkGameOver();
}

function checkGameOver() {
    var successShown = gLevel.SIZE * gLevel.SIZE - gLevel.MINES;
    if (successShown === gState.shownCount && gState.markedCount === gLevel.MINES) {
        AUDIO_WIN.play();
        setTimeout(function () { alert('You have completed the game with success'); }, 200);
        clearInterval(gInterval);
        gInterval = undefined;
        gState.markedCount = 0;
        gState.shownCount = 0;
    }
}

function activateTimer() {
    var seconds = '00';
    var tens = '00';
    var elTens = document.getElementById("tens");
    elTens.innerHTML = '00';
    var elSeconds = document.getElementById("seconds");
    elSeconds.innerHTML = '00';

    clearInterval(gInterval);
    gInterval = setInterval(startTimer, 10);

    function startTimer() {
        tens++;

        if (tens < 9) {
            elTens.innerHTML = "0" + tens;
        }

        if (tens > 9) {
            elTens.innerHTML = tens;
        }

        if (tens > 99) {
            console.log("seconds");
            seconds++;
            elSeconds.innerHTML = "0" + seconds;
            tens = 0;
            elTens.innerHTML = "0" + 0;
        }

        if (seconds > 9) {
            elSeconds.innerHTML = seconds;
        }
    }
}

