

var selectedAlgos = [];
var availableAlgos = [];

var editorCode = localStorage.getItem("editorCode");
var editorCodeName = localStorage.getItem("editorCodeName");

availableAlgos.push({name: editorCodeName, codeString: editorCode, selected: 1});
availableAlgos.push({name: "Medium Bot", codeString: mediumBot.toString(), selected: 0});
availableAlgos.push({name: "Aggressive Bot", codeString: aggressiveBot.toString(), selected: 0});
availableAlgos.push({name: "MakeItSafe", codeString: makeItSafe.toString(), selected: 0});
availableAlgos.push({name: "twSupply", codeString: twSupply.toString(), selected: 0});
availableAlgos.push({name: "twSafer", codeString: twSafer.toString(), selected: 0});

var selectedCells = [];
insertRow(availableAlgos[0]);
insertRowDivider();
for (var i = 1; i < availableAlgos.length; i++) {
	insertRow(availableAlgos[i]);
}
updateTable();

// TODO: set max of 37 selected algos, should show in html count as well
function insertRow(algo) {
	var table = document.getElementById("selection_table");
	var newRow = table.insertRow(table.rows.length);
	var availableCell = newRow.insertCell(0); 	// <tr><td></td></tr>
	var selectedCell = newRow.insertCell(1); 	// <tr><td></td></tr>
	selectedCells.push(selectedCell);

	var divLeft = document.createElement("div");
	divLeft.setAttribute("class", "split_left")
	var divRight = document.createElement("div");
	divRight.setAttribute("class", "split_right");

	var button = document.createElement("button");
	button.setAttribute("class", "btn_select");
	button.addEventListener("click", function() {
		algo.selected++;
		updateTable();
	});

	button.appendChild(document.createTextNode('+'))
	divLeft.appendChild(document.createTextNode(algo.name));
	divRight.appendChild(button);
	availableCell.appendChild(divLeft);
	availableCell.appendChild(divRight);

}

function insertRowDivider() {
	var table = document.getElementById("selection_table");
	var newRow = table.insertRow(table.rows.length);
	var availableCell = newRow.insertCell(0);
	availableCell.appendChild(document.createElement("hr"));

	var selectedCell = newRow.insertCell(1);
	selectedCells.push(selectedCell);

}

function updateTable() {
	selectedAlgos = [];
	for (var i = 0; i < availableAlgos.length; i++) {
		if (availableAlgos[i].selected > 0) {
			selectedAlgos.push(availableAlgos[i]);
		}
		// clear existing content in cell
		while(selectedCells[i].firstChild){
			selectedCells[i].removeChild(selectedCells[i].firstChild);
		}
	}

	for (var i = 0; i < selectedAlgos.length; i++) {

		var divLeft = document.createElement("div");
		divLeft.setAttribute("class", "split_left")
		var divRight = document.createElement("div");
		divRight.setAttribute("class", "split_right");

		var button = document.createElement("button");
		button.setAttribute("class", "btn_select");
		button.addEventListener("click", (function(algo) {
			return function () {
				algo.selected--;
				updateTable();
			};
		})(selectedAlgos[i]));

		button.appendChild(document.createTextNode('-'))
		divLeft.appendChild(document.createTextNode(selectedAlgos[i].selected + "x " + selectedAlgos[i].name));
		divRight.appendChild(button);
		selectedCells[i].appendChild(divLeft);
		selectedCells[i].appendChild(divRight);
	}

}

function prepareCode() {

	// need atleast two algos to start a game, return false to prevent href to game if not satisfied
	if (selectedAlgos.length === 0) {
		alert("At least two players required to play");
		return false;

	} else if (selectedAlgos.length === 1 && selectedAlgos[0].selected < 2) {  // check if the selected algo is repeated at least once
		alert("At least two players required to play");
		return false;

	} else {
		var playerCodes = [];
		for (var i = 0; i < selectedAlgos.length; i++) {
			for (var j = 0; j < selectedAlgos[i].selected; j++) {
				// repeat algo
				// if (j > 0) {
				// 	selectedAlgos[i].name = selectedAlgos[i].name + selected
				// }
				playerCodes.push(selectedAlgos[i]);
			}
		}

		// save algos to local storage
		localStorage.setItem("playerCodes", JSON.stringify(playerCodes));
		return true;
	}
}