function mediumBot(myCells) {

	function getAvailable(cells) {
		return cells.filter(cell => !cell.neighbors.every(neighbor => neighbor.owner === HexOwner.OWN));
	}

	const availableCells = getAvailable(myCells);

	// get all cells with enemy neighbors
	const attackerCells = myCells.filter(cell => cell.neighbors.some(n => n.owner !== HexOwner.OWN));

	var bestAttacker = null;
	var bestTarget = null;
	var maxDiff = 1000;
	for (var i = 0; i < attackerCells.length; i++) {
		var attacker = attackerCells[i];
		for (var j = 0; j < attacker.neighbors.length; j++) {
			var target = attacker.neighbors[j];
			if (target.resources - attacker.resources < maxDiff && target.owner !== HexOwner.OWN) {
				maxDiff = target.resources - attacker.resources;
				bestAttacker = attacker;
				bestTarget = target;
			}
		}
	}

	var transaction = {fromId: bestAttacker.id, toId: bestTarget.id, transferAmount: bestAttacker.resources - 1};
	return transaction;
}
