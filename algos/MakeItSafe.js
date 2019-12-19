function makeItSafe(myCells) {

	var firstTurn = myCells.length === 1 && myCells[0].resources === 10;

	var assignedCells = {};
	var clusters = {};

	var clusterCount = 0;
	var cluster = 0;

	for (var i = 0; i < myCells.length; i++) {
		var cell = myCells[i];

		if (cell.id in assignedCells) {
			cluster = assignedCells[cell.id];
			clusters[cluster].push(cell);

		} else {
			cluster = clusterCount;
			clusters[cluster] = [];
			clusters[cluster].push(cell);
			clusterCount++;

		}

		for (var j = 0; j < cell.neighbors.length; j++) {
			var neighbor = cell.neighbors[j];

			if (neighbor.owner === HexOwner.OWN) {
				if (neighbor.id in assignedCells && assignedCells[neighbor.id] !== cluster) {
					var mergeCluster = cluster;
					cluster = assignedCells[neighbor.id];

					for (var t = 0; t < clusters[mergeCluster].length; t++) {
						var mergeCell = clusters[mergeCluster][t];

						clusters[cluster].push(mergeCell);
						assignedCells[mergeCell.id] = cluster;
					}
					clusters[mergeCluster] = [];

				} else {
					assignedCells[neighbor.id] = cluster;

				}
			}
		}
	}

	var maxClusterSize = 0;
	var maxClusterId = 0;

	for (var key in clusters) {
		var currentCluster = clusters[key];
		
		if (maxClusterSize < currentCluster.length) {
			maxClusterSize = currentCluster.length;
			maxClusterId = key;
		}
	}
		
	var friendlyNeighbors = {};
	var enemies = {};
	var bestNeighbor = {};

	var secureFriends = [];
	var unsecureFriends = [];

	var freeCells = false;

	for (var i = 0; i < clusters[maxClusterId].length; i++) {
		var cell = clusters[maxClusterId][i];

		var insecure = 0;


		for (var j = 0; j < cell.neighbors.length; j++) {
			var neighbor = cell.neighbors[j];

			if (neighbor.owner !== HexOwner.OWN) {
				if (neighbor.id in friendlyNeighbors) {
					friendlyNeighbors[neighbor.id]++;

					var bestNeighborSupply = bestNeighbor[neighbor.id].resources;
					if (bestNeighborSupply < cell.resources) {
						bestNeighbor[neighbor.id] = cell;
					}
				} else {
					friendlyNeighbors[neighbor.id] = 1;
					enemies[neighbor.id] = neighbor;
					bestNeighbor[neighbor.id] = cell;

					if (neighbor.resources === 0) {
						freeCells = true;
					}
				}

				if (neighbor.owner === HexOwner.OTHER) {
					insecure++;
				}
			}
		}


		if (insecure === 0) {
			secureFriends.push(cell);

		} else if (cell.resources < 100) {
			unsecureFriends.push(cell);

		}
	}

	var maxFriendlyNeighbors = 0;
	var minEnemy = 500;

	var source = null;
	var target = null;

	for (var key in friendlyNeighbors) {

		if (freeCells) {
			if (enemies[key].maxGrowth === 300 && enemies[key].resources === 0) {
				source = bestNeighbor[key];
				target = enemies[key];
				break;
			}

			if (maxFriendlyNeighbors < friendlyNeighbors[key] && enemies[key].resources === 0) {
				source = bestNeighbor[key];
				target = enemies[key];
				maxFriendlyNeighbors = friendlyNeighbors[key];
			}

		} else {
			if (maxFriendlyNeighbors === friendlyNeighbors[key]) {
				if (minEnemy > enemies[key].resources) {
					minEnemy = enemies[key].resources;

					source = bestNeighbor[key];
					target = enemies[key];
				}

			} else if (maxFriendlyNeighbors < friendlyNeighbors[key]) {
				source = bestNeighbor[key];
				target = enemies[key];
				maxFriendlyNeighbors = friendlyNeighbors[key];
				minEnemy = enemies[key].resources;
			}
		}
	}

	if (firstTurn) {
		firstTurn = false;
		return {fromId: source.id, toId: target.id, transferAmount: source.resources - 1};
	}

	if (freeCells || clusters[maxClusterId].length === 1) {
		return {fromId: source.id, toId: target.id, transferAmount: 1};
	}

	var bestSupplyCell = null;
	var useSecureFriend = false;

	if (secureFriends.length > 0) {

		for (var i = 0; i < secureFriends.length; i++) {
			var cell = secureFriends[i];

			if (cell.id === source.id) {
				continue;

			} else if (bestSupplyCell === null) {
				useSecureFriend = true;
				bestSupplyCell = cell;

			} else if (cell.resources === cell.maxGrowth && cell.maxGrowth === 300) {
				useSecureFriend = true;
				bestSupplyCell = cell;
				break;

			} else if (bestSupplyCell.resources < cell.resources && cell.maxGrowth < 300) {
				useSecureFriend = true;
				bestSupplyCell = cell;
			}
		}

		if (bestSupplyCell.resources < bestSupplyCell.maxGrowth) {

			for (var i = 0; i < clusters[maxClusterId].length; i++) {
				var cell = clusters[maxClusterId][i];

				if (cell.id === source.id) {
					continue;

				} else if (cell.resources === cell.maxGrowth && cell.maxGrowth === 300 && !(cell in secureFriends)) {
					bestSupplyCell = cell;
					useSecureFriend = false;
					break;
				}
			}
		}
	}

	if (bestSupplyCell === null) {
		for (var i = 0; i < clusters[maxClusterId].length; i++) {
			var cell = clusters[maxClusterId][i];

			if (cell.id === source.id) {
				continue;

			} else if (bestSupplyCell === null || bestSupplyCell.resources < cell.resources) {
				bestSupplyCell = cell;
			}
		}
	}


	if (unsecureFriends.length > 0 && useSecureFriend) {
		var unsecureTarget = null;

		for (var i = 0; i < unsecureFriends.length; i++) {
			var cell = unsecureFriends[i];

			if (cell.id === source.id) {
				continue;

			} else if (unsecureTarget === null) {
				unsecureTarget = cell;

			} else if (unsecureTarget.resources < cell.resources) {
				unsecureTarget = cell;

			}
		}

		if (unsecureTarget !== null) {
			return {fromId: bestSupplyCell.id, toId: unsecureTarget.id, transferAmount: bestSupplyCell.resources - 1};

		}
	}

	var resources = 0;
	var friends = 0;

	for (var i = 0; i < source.neighbors.length; i++) {
		var neighbor = source.neighbors[i];

		if (neighbor.owner === HexOwner.OWN) {
			friends++;

		}
	}

	if (friends >= 5) {
		resources = source.resources - 1;

	} else if (source.resources - (source.maxGrowth - 100) > 99) {
		resources = source.resources - 99;

	}

	var sourceId = source.id;
	var targetId = target.id;

	if (resources <= target.resources + 100 && target.resources > 0) {
		if (bestSupplyCell !== null && bestSupplyCell.id !== source.id) {
			targetId = source.id;
			sourceId = bestSupplyCell.id;

			if (useSecureFriend) {
				resources = bestSupplyCell.resources - 1;

			} else if (bestSupplyCell.resources - (bestSupplyCell.maxGrowth - 100) > 99) {
				resources = bestSupplyCell.resources - 99;

			} else {
				resources = 0;
			}

		} else {
			resources = 0;
		}
	}

	return {fromId: sourceId, toId: targetId, transferAmount: resources};

}
