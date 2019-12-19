function aggressiveBot(myCells) {
	const availableCells = myCells.filter(cell => !cell.neighbors.every(neighbor => neighbor.owner === HexOwner.OWN));

	// get all cells with enemy neighbors
	const attackerCells = myCells.filter(cell => cell.neighbors.some(n => n.owner !== HexOwner.OWN));

	var maxRes = 0;
	var attacker = null;
	for (var i = 0; i < attackerCells.length; i++) {
		if (attackerCells[i].resources > maxRes) {
			maxRes = attackerCells[i].resources;
			attacker = attackerCells[i];
		}
	}


	var minRes = 2000;
	var target = null;
	for (var i = 0; i < attacker.neighbors.length; i++) {
		if (attacker.neighbors[i].resources < minRes && attacker.neighbors[i].owner !== HexOwner.OWN) {
			minRes = attacker.neighbors[i].resources;
			target = attacker.neighbors[i];
		}
	}
	var transaction = {fromId: attacker.id, toId: target.id, transferAmount: attacker.resources - 1};
	return transaction;
}