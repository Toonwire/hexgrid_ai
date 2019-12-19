function twSupply(myCells) {

	function isSafe(cell) {
		return !cell.neighbors.some(n => n.owner === HexOwner.OTHER);
	}

	function countSafeCells(cells) {
		let count = 0;
		for (var i = 0; i < cells.length; i++) {
			count += isSafe(cells[i]) ? 1 : 0;
		}
		return count;
	}

	function nearbyCells(cell, cellOwner) {
		return cell.neighbors.filter(n => n.owner === cellOwner);
	}

	function nearbyFriends(neighbor, cells) {
		let friends = 0;
		for (var i = 0; i < cells.length; i++) {
			for (var j = 0; j < cells[i].neighbors.length; j++) {
				if (cells[i].neighbors[j].id === neighbor.id) {
					friends++;
					break;
				}
			}
		}
		return friends;
	}

	function hasFreeNones(cells) {
		for (var i = 0; i < cells.length; i++) {
			for (var j = 0; j < cells[i].neighbors.length; j++) {
				if (cells[i].neighbors[j].owner === HexOwner.NONE && cells[i].neighbors[j].resources === 0)
					return true;
			}
		}
		return false;
	}

	function getLargestCluster(cells) {
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
		return clusters[maxClusterId];
	}


	var freeNones = hasFreeNones(myCells);

	var source = null;
	var target = null;

	var minResources = 300, maxResources = 0, maxFriends = 0;

	var maxCluster = getLargestCluster(myCells);
	for (var i = 0; i < maxCluster.length; i++) {
		var cell = maxCluster[i];

		for (var j = 0; j < cell.neighbors.length; j++) {
			var neighbor = cell.neighbors[j];

			if (neighbor.owner === HexOwner.OWN) continue;
			let numFriends = nearbyFriends(neighbor, myCells);

			if (freeNones) {
				// bloom to super cells asap
				// this appreach depends solely on foritifaction cells
				if (neighbor.maxGrowth === 300) {
					source = cell;
					target = neighbor;
					break;
				}

				// frind cells bordering free none, expanding the bloom
				if (numFriends > maxFriends && neighbor.resources === 0) {
					source = cell;
					target = neighbor;
					maxResources = cell.resources;
					maxFriends = numFriends;
				}
			} else {
				if (numFriends > maxFriends) {
					source = cell;
					target = neighbor;
					maxFriends = numFriends;
					minResources = neighbor.resources;

				} else if (numFriends === maxFriends) {
					if (neighbor.resources < minResources) {
						source = cell;
						target = neighbor;
						maxFriends = numFriends;
						minResources = neighbor.resources;
					}
				}
			}
		}
	}

	if (source === null || target === null) {
		return {fromId: maxCluster[0], toId: maxCluster[0].neighbors[0], transferAmount: maxCluster[0].resources - 1};
	}

	let transferAmount = source.resources - 1;
	if (!freeNones && target.owner !== HexOwner.OWN && myCells.length !== 1) {
		let sourceResourcesAfterTakeover = 75;
		let targetResourcesAfterTakeover = 75;

		if (maxCluster.length >= 50) {
			sourceResourcesAfterTakeover = 100;
			targetResourcesAfterTakeover = 100;
		}

 		// dont go below 100 when expanding
        // 100 in both source and target + whatever the currently present resource count is
        let totalResourcesNeededForTakeover = sourceResourcesAfterTakeover + targetResourcesAfterTakeover + target.resources;    
        //+ 1 for natural growth
        //if (target.Resources != target.MaxGrowth) totalResourcesNeededForTakeover += 1;

        // subtract what is already available in attacker
        let resourcesNeededForTakeover = totalResourcesNeededForTakeover - source.resources;
        
        if (resourcesNeededForTakeover < 0) { // can perform takeover
            transferAmount = source.resources - sourceResourcesAfterTakeover;

        } else { 	// assist 

            // transfer from safe cells and super cells to reach comfortable diff during takeover
            // if safe, take from supercell, otherwise regular cell (who can supply most resources)
            // else see if there are resources to supply from outer cells (only if above max growth)

            let bestHelper = null;
            let bestSupply = 0;
            let numSafeCells = countSafeCells(myCells);

            for (var i = 0; i < maxCluster.length; i++) {
            	var cell = maxCluster[i];

            	if (cell === source) continue;
            	if (isSafe(cell)) {
                    // skip non-full supercells when there are a decent amount of safe cells
                    // full supercells will be used later to facilitate big takeovers in one step
                    if (cell.maxGrowth === 300 && cell.resources < 300 && numSafeCells > 10) continue;

                    // take from super cells when 300
                    if (cell.maxGrowth === 300 && cell.resources >= 300) {
                    	bestHelper = cell;
                    	bestSupply = cell.resources;
                    	break;
                    }

                    if (cell.resources > bestSupply) {
                    	bestHelper = cell;
                    	bestSupply = cell.resources;
                    
                    } else if (cell.resources === bestSupply && cell.maxGrowth === 300) {
                    	// prioritize supercell
                    	bestHelper = cell;
                    } 
            	}

            	if (cell.resources - cell.maxGrowth > bestSupply - 1) {
            		bestHelper = cell;
            		bestSupply = cell.resources - cell.maxGrowth + 1;
            	}

            	if (cell.maxGrowth === 300 && cell.resources - 100 > bestSupply) {
            		if (cell.resources > 200) {
            			bestHelper = cell;
            			bestSupply = cell.resources - 100;
            		} /*else if (cell.resources > 100 + resourcesNeededForTakeover) {
            			bestHelper = cell;
            			bestSupply = cell.resourcesNeededForTakeover - resourcesNeededForTakeover;
            		} */

            	}
            }

            if (bestHelper === null) {
            	if (maxCluster.length === 1) 
            		return {fromId: source.id, toId: target.Id, transferAmount: source.resources / 2};

            	// no cell can supply resources
            	for (var i = 0; i < maxCluster.length; i++) {
            		var supplyCell = maxCluster[i];

            		if (supplyCell.resources === supplyCell.maxGrowth) {
            			if (supplyCell.id === source.id) continue;
            			return {fromId: supplyCell.id, toId: source.id, transferAmount: 1};
            		}
            	}
            	return {fromId: source.id, toId: target.id, transferAmount: 0};
            }
        	return {fromId: bestHelper.id, toId: source.id, transferAmount: bestSupply};
        }
	}
	return {fromId: source.id, toId: target.id, transferAmount: transferAmount};
}