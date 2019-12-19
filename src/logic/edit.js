
initEditorCode();
function initEditorCode() {
	var editor = ace.edit("editor");
	var defaultCode = `
/**
* id 			string (unique identifier for a hexagon cell)
* resources		int (amount displayed in hexagon)
* maxGrowth 	int (normal cells: 100, super cells: 300)
* owner 		enum HexOwner {NONE: 0, OWN: 1, OTHER: 2}
* 					HexOwner.NONE 	Unoccupied hexagon
*  					HexOwner.OWN 	Hexagon controlled by this player (you)
*  					HexOwner.OTHER 	Hexagon controlled another player (opponent)
*
* playerCell 	{id:string, resources:int, maxGrowth:int, neighborCells:neighborCell[]}
* neighborCell 	{id:string, resources:int, owner:HexOwner, maxGrowth:int}
* myCells 		playerCell[]
*/

function turn(myCells) {
	// get all cells with enemy neighbors and sort by resources
	const attackerCells = myCells
	    .filter(cell => cell.neighbors.some(n => n.owner !== HexOwner.OWN))
	    .sort((a, b) => b.resources - a.resources);
	var strongestAttacker = attackerCells[0];
	
	// find and sort neighbors of the most resourceful attacker
	const targetCells = strongestAttacker.neighbors
	    .filter(n => n.owner !== HexOwner.OWN)
	    .sort((a, b) => a.resources - b.resources);
	var weakestTarget = targetCells[0];
	
	var transaction = {fromId: strongestAttacker.id, toId: weakestTarget.id, transferAmount: strongestAttacker.resources - 1};
	return transaction;
}`;

	var savedCode = localStorage.getItem("editorCode");
	if (savedCode !== null && savedCode !== "" && savedCode !== defaultCode) {
		editor.setValue(savedCode, 1);

	} else {
		editor.setValue(defaultCode, 1);
	}

	// also set name for the saved code if exists in local storage 
	if (localStorage.getItem("editorCodeName") !== null) {
		document.getElementById("algo_name").innerHTML = localStorage.getItem("editorCodeName");
	} else {
		document.getElementById("algo_name").innerHTML = "MyCode";
	}

}


function saveCode() {
	// save code in editor to local storage
	var editor = ace.edit("editor");
	localStorage.setItem("editorCode", editor.getValue());

	// save name of algo to local storage
	var algoName = document.getElementById("algo_name").innerHTML;
	if (algoName.trim() === "") {
		algoName = "MyCode";
	}
	localStorage.setItem("editorCodeName", algoName);
}

function handleKeypress(element, event) {
	if (!event) {
        event = window.event;
    }
    var keyCode = event.which || event.keyCode;

	// - ignore enter key events to prevent line breaks
    // - prevent more than 20 characters
    // - allow delete (46) and backspace (8)
    if (keyCode === 13 
    	|| keyCode === 32 
    	|| (element.innerText.length > 20 && keyCode !== 8 && keyCode !== 46)
    	|| element.innerText.length < 2 && (keyCode === 8 || keyCode === 46)) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
        return false;
    }
    return true;
}

function handlePaste(e) {
	// ignore paste all together
	if (!e) {
        e = window.event;
    }
    if (e.preventDefault) {
        e.preventDefault();
    } else {
        e.returnValue = false;
    }
    return false;
}