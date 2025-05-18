//Some preliminary actions
//Initialize the cloud's building
// things = response_data['data'];
// let number_things = things.length;
// //Set up the canvas
// const canvas = new OffscreenCanvas(200, 200);
// const context = canvas.getContext("2d", { willReadFrequently: true });
// const canvas_height = canvas.height;
// const canvas_width = canvas.width;
// context.fillStyle = "#000000";
// context.globalAlpha = 1;
// //SVGs
// const picture = document.querySelector("#svg_field");
// //Set up the plane
// //Get the number of leaves
// const appr_n_leaves = Math.ceil(number_things / 3);
// //Get the approximate size
// const min_size = 1600;
// let initial_size = 200 * Math.round(appr_n_leaves * (canvas_width / 4) / 200);
// if (initial_size < min_size) {
// 	initial_size = min_size;
// }
// //Get the number of splits
// n_splits = Math.ceil(Math.log2(initial_size / 50));
// //Get the exact size
// initial_size = Math.pow(2, n_splits - 1) * (canvas_width / 4);
// //Calclulate the plane's dimensions
// const min_square_x = 0 - initial_size / 2;
// const min_square_y = min_square_x;
// const max_square_x = Math.abs(min_square_x);
// const max_square_y = max_square_x;

// //Create the plane
// plane_l0 = new Map();
// content_l0 = {'id': 0,
// 								'parent_id': 0,
// 								'x_min': min_square_x,
// 								'y_min': min_square_y,
// 								'x_max': max_square_x,
// 								'y_max': max_square_y,
// 								'area': 0,
// 								'n_things': 0,
// 								'children': []};
// plane_l0.set(content_l0.id, content_l0);

// FUNCTIONS needed to distribute scaffolds on the SVG-field
//Function to get the indices of the array values larger than ZERO
function getIndex_nonzero (array){
	const rslt_indices = [];
	//In reverse order to get the length of the row easily
	for (let i = array.length - 1; i >= 0; i--) {
		if (array[i] > 0) {
			rslt_indices.push(i);
		}
	}
	return rslt_indices;
}

//Construct splits using WFS
function construct_split (plane_level_map, n_future_splits, set_get_quads, initial_size, rslt_arr) {
	if (n_future_splits === 0) {
		return rslt_arr;
	} else {
		let future_leaves = new Map();
		//Acces each leaf on the level
		node_loop: for (const [node_key, node_value] of plane_level_map) {
			let future_leaves_part = set_get_quads(node_value, initial_size, n_future_splits);
			//Set the leaves of the future level
			future_node_loop: for (const [future_node_key, future_node_value] of future_leaves_part) {
				future_leaves.set(future_node_key, future_node_value);
				//Add children' ids to the node value of the level map
				if (Object.hasOwn(node_value, 'children')) {
					node_value['children'].push(future_node_value['id']);
				}
				plane_level_map.set(node_key, node_value);
			}
		}
		//Save the previous level map
		rslt_arr.push(plane_level_map);
		//Adjust parameters
		n_future_splits = n_future_splits - 1;
		initial_size = initial_size / 2;
		//Repeat
		return construct_split(future_leaves, n_future_splits, set_get_quads, initial_size, rslt_arr);
	}
}

//Function to create 4 children
function set_get_quads (target_node, initial_size, n_future_splits) {
	//Add quads
	let children = new Map();
	quad_loop: for (let i = 0; i < 4; i++) {
		let item = {};
		item.id = target_node['id'] + '_' + i;
		item.parent_id = target_node['id'];
		//Coordinates:
		// Q-0 | Q-1
		// ---------
		// Q-3 | Q-2
		switch (i) {
			case 0 : {
				item.x_min = target_node['x_min'];
				item.x_max = target_node['x_min'] + initial_size / 2;
				item.y_min = target_node['y_min'];
				item.y_max = target_node['y_min'] + initial_size / 2;
				break;
			}
			case 1 : {
					item.x_min = target_node['x_min'] + initial_size / 2;
					item.x_max = target_node['x_min'] + initial_size;
					item.y_min = target_node['y_min'];
					item.y_max = target_node['y_min'] + initial_size / 2;
					break;
			}
			case 2 : {
					item.x_min = target_node['x_min'] + initial_size / 2;
					item.x_max = target_node['x_min'] + initial_size;
					item.y_min = target_node['y_min'] + initial_size / 2;
					item.y_max = target_node['y_min'] + initial_size;
					break;
			}
			case 3 : {
					item.x_min = target_node['x_min'];
					item.x_max = target_node['x_min'] + initial_size / 2;
					item.y_min = target_node['y_min'] + initial_size / 2;
					item.y_max = target_node['y_min'] + initial_size;
					break;
			}
		}
		item.area = 0;
		item.n_things = 0;
		if (n_future_splits > 2) {
			item.children = [];
		} else {
			item.pixels = new Map();
		}
		children.set(item.id, item);
	}
	//Add children to the target_node of the map
	return children;
}

//Function* Spiral generator
function* generate_coords (x_start, y_start, thing_width, thing_height) {
	let n = 0;
	let r = 8;
	let elongation = 2.5
	while (true) {
		n = n + 1;
		//let dx = thing_width * 2;
		//let dy = thing_height * 2;
		let dx = thing_width * 3;
		let dy = thing_height * 3;
		//#334996
		let d_mult = 1;
		//Randomization of the coordinates
		let x = Math.round( x_start + 2 * elongation * r * Math.sqrt( 2*d_mult*dx*n / r ) * Math.cos( 2*dx*n / r) + ( Math.round(Math.random()) * 2 - 1 ) * ( Math.random() * 1.75 * dx) );
		let y = Math.round( y_start + 2* r * Math.sqrt( 2*d_mult*dy*n / r ) * Math.sin( 2*dy*n / r) + ( Math.round(Math.random()) * 2 - 1 ) * ( Math.random() * dy) );
		yield [x, y];
	}
}

//Function to draw thing on canvas
function draw_canvas (svg_thing, canvas, context) {
	return new Promise((resolve, reject) => {
		let svgURL = svg_thing;
		let img = new Image();
		let width = canvas.width;
		let height = canvas.height;
		img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);
		img.addEventListener('load', function(){context.drawImage(img, 0, 0, width, height, 0, 0, width, height); resolve("result");});
	});
}

//Function to draw the thing on svg_field
function place_thing (svg_field, svg_thing, current_coords) {
	return new Promise((resolve, reject) => {
		//Prepare the thing for placement
		let thing = new DOMParser().parseFromString(svg_thing, 'application/xml').documentElement.querySelector(".thing");
		//Create mutationObserver to watch for svg_field's attributes and resolve promise.
		let observer_svg = new MutationObserver((mutations) => {
			observer_svg.disconnect();
			resolve("result");
		});
		observer_svg.observe(svg_field, {
			attributes: true,
			childList: true
		});
		//Append thing to svg_field
		svg_field.appendChild(thing);
		//Translate
		thing.setAttribute('transform', `translate(${current_coords[0]}, ${current_coords[1]})`);
	});
}

//Function to get the ocupied pixels
function get_pixels (canvas, context, getIndex_nonzero) {
	return new Promise((resolve, reject) => {
		//Get alpha values, SEE: https://stackoverflow.com/questions/29847988/convert-uint8clampedarray-to-regular-array
		let imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
		let pixelVal = imageData.filter((value, index) => index % 4 === (4 - 1));
		pixelVal = Array.prototype.slice.call(pixelVal);
		//console.log(pixelVal); // --> OK 
		//console.log(pixelVal.length); // --> OK
		//Convert to the pixelMap having non-zero x-indices as keys and non-zero y-indices as values
		//Get the size_x and size_y
		let pixel_map = new Map();
		let size_x = 0;
		let size_y = 0;
		let size_filled = 0;
		//console.log("---- START of rows' processing ----");
		//Fill the pixel_map
		while (pixelVal.length > 0) {
    			const row = pixelVal.splice(0, canvas.height);
    			//console.log(row); // --> OK
    			size_y++;
    			//Check if row has at least one non-zero element
    			let row_initialized = 0;
    			if (row.some((x) => x > 0)) {
    				//Get the indices of nonzero values
    				let indices_row_nonzero = getIndex_nonzero(row);
    				//console.log(indices_row_nonzero);
    				size_filled = size_filled + indices_row_nonzero.length;
    				//Get the indices for the values larger than 0 and assign them to the pixel_map row
    				pixel_map.set(size_y - 1, indices_row_nonzero);
    				size_x = indices_row_nonzero[0] > size_x ? indices_row_nonzero[0] : size_x;
    				row_initialized = 1;
    			} else {
    				if (row_initialized === 1) {
    					break;
    				} else {
    					continue;
    				}
    			}
		}
		//Small correction
		size_y--;
		let pixels = [pixel_map, size_x, size_y, size_filled];
		//Return the pixel_map
		setTimeout(() => {resolve(pixels)}, 0);
	});
}

//Function to detect intersection on the pixel level
function check_pixel_intersection (pixel_query, splits_arr, current_coords, query_len_x, query_len_y, thing_counter) {
	//Prepare
	let intersection = 0;
	let split = 0;
	let affected_children = [];
	let affected_leaves = [];
	//Check if the thing is out of outer bounds
	if ( current_coords[0] > splits_arr[0].get(0)['x_max'] || current_coords[1] > splits_arr[0].get(0)['y_max'] || 
			current_coords[0] + query_len_x < splits_arr[0].get(0)['x_min'] || current_coords[1] + query_len_y < splits_arr[0].get(0)['y_min'] ) {
				intersection = -1;
				return [intersection, []];
	}
	//Function to retrive the potentially affected leaves
	function get_affected_children (splits_arr, split, node_ids, current_coords, query_len_x, query_len_y) {
		let future_node_ids = [];
		for (let i = 0; i < node_ids.length; i++) {
			let node = splits_arr[split].get(node_ids[i]);
			//SEE for example: https://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
			//if (RectA.X1 < RectB.X2 && RectA.X2 > RectB.X1 &&
			//RectA.Y1 > RectB.Y2 && RectA.Y2 < RectB.Y1)
			if ( current_coords[0] < node['x_max'] & current_coords[0] + query_len_x >= node['x_min'] &
				 current_coords[1] < node['y_max'] & current_coords[1] + query_len_y >= node['y_min'] ) {
				future_node_ids = future_node_ids.concat(node['children']);
			}
		}
		if ( Object.hasOwn(splits_arr[split+1].get(future_node_ids[0]), 'pixels') ) {
			return future_node_ids;
		} else {
			split += 1;
			return get_affected_children(splits_arr, split, future_node_ids, current_coords, query_len_x, query_len_y);
		}
	}

	//Quest for the affected leaves and intersections
	split += 1;
	affected_children = splits_arr[0].get(0)['children'];
	potentially_affected_leaves = get_affected_children(splits_arr, split, affected_children, current_coords, query_len_x, query_len_y);
	//Proceed with the affected leaves and their pixels
	for (let i = 0; i < potentially_affected_leaves.length; i++) {
		//Check boxes' intersection
		let content_node = splits_arr[splits_arr.length - 1].get(potentially_affected_leaves[i]);
		if ( current_coords[0] < content_node['x_max'] & current_coords[0] + query_len_x >= content_node['x_min'] &
				 current_coords[1] < content_node['y_max'] & current_coords[1] + query_len_y >= content_node['y_min'] ) {
			let content_pixels = content_node['pixels'];
			affected_leaves.push(content_node);
			//Check if content_pixels is empty => no intersection
			if(content_pixels.size === 0) {
				continue;
			}
			//Iterate through the query pixels to detect the intersection
			pixel_query_loop: for (let [pixel_key, pixel_value] of pixel_query) {
				//Look up for Ys
				//console.log(pixel_key + current_coords[1]);
				if( content_pixels.has(pixel_key + current_coords[1]) ) {
					//Look up for Xs
					let content_Xs = content_pixels.get(pixel_key + current_coords[1]);
						for (let x_value of pixel_value) {
							x_value = x_value + current_coords[0];
							if ( content_Xs.has(x_value) ) {
								intersection = 1;
								return [intersection, []];
						}
					}
					
				}
			}
		}
	}

	//SUCCESS
	return [intersection, affected_leaves];	
}

//Function to update pixels on the plane after successful placement
function update_leaves (pixel_query, current_coords, split_with_leaves, affected_leaves) {
	//Prepare
	let start_x;
	let start_y;
	let end_x;
	let end_y;
	//function to modify pixel Map
	function update_pixels_forQuad (pixel_query, current_coords, x_start, y_start, end_x, end_y) {
		let pixel_object = Object.fromEntries(pixel_query);
		let Ys = Object.keys(pixel_object);
		let Xs = Object.values(pixel_object);
		let delta_area = 0;
		//Trim Ys
		Ys = Ys.slice(start_y, end_y);
		Xs = Xs.slice(start_y, end_y);
		//Adjust Xs
		for (let i = 0; i < Xs.length; i++) {
			//Trim Xs
			Xs[i] = Xs[i].filter((x) => x >= start_x & x < end_x );
			//Adjust Xs
			for (let k = 0; k < Xs[i].length; k++) {
				Xs[i][k] = parseInt(Xs[i][k]) + current_coords[0];
				delta_area++
			}
		}
		//Adjust Ys
		for (let i = 0; i < Ys.length; i++) {
			Ys[i] = parseInt(Ys[i]) + current_coords[1];
		}
		//Convert Xs back into Set
		for (let i = 0; i < Xs.length; i++) {
			Xs[i] = new Set(Xs[i]);
		}
		//Gather XYs back into Map
		pixel_query = new Map();
		for (let i = 0; i < Ys.length; i++) {
			pixel_query.set(Ys[i], Xs[i]);
		}
		return [delta_area, pixel_query];
	}
	//Process each affected leaf
	for (let i = 0; i < affected_leaves.length; i++) {
		//Check the leaf bounds to select query subset (50px) for the pixel data to be added into speciffic quad
		let leaf_id = affected_leaves[i]['id'];
		if (affected_leaves[i]['y_min'] >= current_coords[1]) {start_y = affected_leaves[i]['y_min'] - current_coords[1];} else {start_y = 0;}
		if (affected_leaves[i]['x_min'] >= current_coords[0]) {start_x = affected_leaves[i]['x_min'] - current_coords[0];} else {start_x = 0;}
		if (start_x === 0) {
			end_x = affected_leaves[i]['x_max'] - current_coords[0];
		} else { end_x = start_x + 50; }
		if (start_y === 0) {
			end_y = affected_leaves[i]['y_max'] - current_coords[1];
		} else {end_y = start_y + 50;}
		//console.log([start_x, end_x, start_y, end_y]);
		//Get the updated pixels and area for quad
		let pixel_update = update_pixels_forQuad(pixel_query, current_coords, start_x, start_y, end_x, end_y);
		//Update leaf
		let updated_leaf = split_with_leaves.get(leaf_id);
		updated_leaf.area = updated_leaf.area + pixel_update[0];
		updated_leaf.n_things = updated_leaf.n_things + 1;
		//Seriously update the content's pixels
		for (const [update_key, update_value] of pixel_update[1]) {
			//Check Ys
			if ( updated_leaf.pixels.has(update_key) ) {
				let row_update = new Set([...updated_leaf.pixels.get(update_key), ...update_value]);
				updated_leaf.pixels.set(update_key, row_update);
			} else {
				updated_leaf.pixels.set(update_key, update_value);
			}
		}
		//Insert updated leaf
		split_with_leaves.set(leaf_id, updated_leaf);
	}
}

//Main function to place the things on SVG without intersections
async function placer (levels, svg_field, array_svg, canvas, canvas_width, canvas_height, context, getIndex_nonzero){
	//Function to decompress the SVG-string
	// SEE: https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
	// SEE: https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API#examples
	async function decompress_svg (compressed_svg) {
		const svg_byteCharacters = atob(compressed_svg.substring(2, compressed_svg.length-1));
		const svg_byteNumbers = new Array(svg_byteCharacters.length);
		for (let i = 0; i < svg_byteCharacters.length; i++) {
				svg_byteNumbers[i] = svg_byteCharacters.charCodeAt(i);
		}
		const svg_byteArray = new Uint8Array(svg_byteNumbers);
		const svg_blob = new Blob([svg_byteArray], {type: ""});
			const svg_processing_stream = new DecompressionStream("deflate");
		const svg_processed_stream = svg_blob.stream().pipeThrough(svg_processing_stream);
		return await new Response(svg_processed_stream).blob();
	}

	//+++ Initialize the array to store the info on success's probability
	stat_arr = [];
	//++
	//svg_field.innerHTML = "";
	svg_field.setAttribute('viewBox', '-500 -500 1000 1000');
	let item_counter = 0;
	let spiral_generator;
	let query;
	let query_area;
	let query_pixels;
	let current_coords;
	let item_matrix;
	//Create the collection to store used coordinates and 
	past_points = new Set();
	let past_radius = 10;
	//START
	for (const item of array_svg) {
		let current_coords;
		let intersection = 0;
		//Initialize the coords generator
		spiral_generator = generate_coords(0, 0, Math.min(item.length / 20, item.height / 20), Math.min(item.length / 20, item.height / 20));
		//+++
		let item_map;
		item_counter++;
		let svg_thing_compressed = item.svg_thing;
		let svg_blob = await decompress_svg(svg_thing_compressed);
		let svg_thing = await svg_blob.text();
		//Draw
		await draw_canvas(svg_thing, canvas, context);
		//Get the pixels
		query_whole = await get_pixels(canvas, context, getIndex_nonzero);
		//console.log(query_whole);
		//let pixels = [pixel_map, size_x, size_y, size_filled];
		pixel_query = query_whole[0];
		query_len_x = query_whole[1];
		query_len_y = query_whole[2];
		query_area = query_whole[3];
		//Clear the canvas
		context.clearRect(0, 0, canvas_width, canvas_height);
		if (item_counter == 1) {
			current_coords = [0, 0];
			t_current_coords = current_coords;
			//Actually place the thing
			await place_thing(svg_field, svg_thing, current_coords);
			//Get the affected leaves
			affected_leaves = check_pixel_intersection(pixel_query, levels, current_coords, query_len_x, query_len_y, item_counter)[1];
			//Update the plane
			update_leaves (pixel_query, current_coords, levels[levels.length-1], affected_leaves);
			//+++ Statistics
			for (let i = 0; i < affected_leaves.length; i++) {
				stat_arr.push({ "number": item_counter, "X": current_coords[0], "Y": current_coords[1], "query_width": query_len_x,
								"query_height": query_len_y, "leaf": affected_leaves[i]['id'], "square_filled": affected_leaves[i]['area'],
								"n_objects": affected_leaves[i]['n_things'], "success": 1 });
			}
		} else {
			do {
				//Get coords
				current_coords = spiral_generator.next().value;
				//Check in collection
				let current_point = current_coords.join('_');
				if ( past_points.has(current_point) ) {
					//console.log(current_point);
					intersection = 1;
				} else {
					//Reset intersection
					intersection = 0;
					//Prepare the data for intersection detection
					intersection_rslt = check_pixel_intersection(pixel_query, levels, current_coords, query_len_x, query_len_y, item_counter);
					intersection = intersection_rslt[0];
					affected_leaves = intersection_rslt[1];
				}
				if ( intersection > 0 ) {
					for (let i = 0; i < affected_leaves.length; i++) {
						stat_arr.push({ "number": item_counter, "X": current_coords[0], "Y": current_coords[1], "query_width": query_len_x,
									"query_height": query_len_y, "leaf": affected_leaves[i]['id'], "square_filled": affected_leaves[i]['area'],
									"n_objects": affected_leaves[i]['n_things'], "success": 0 });
					}
				}
			} while (intersection > 0);

			//Place the thing
			if (intersection === 0) {
				//console.log(pixel_query);
				await place_thing(svg_field, svg_thing, current_coords);
				//Update the plane
				update_leaves(pixel_query, current_coords, levels[levels.length-1], affected_leaves);
				//Update the collection of past points
				past_points.add(current_coords.join('_'));
				for (let i = current_coords[0] - past_radius; i <= current_coords[0] + past_radius; i++) {
					for (let k = current_coords[1] - past_radius; k <= current_coords[1] + past_radius; k++) {
						//Calculate
						let x_add = i;
						let y_add = k;
						//Update
						past_points.add([x_add, y_add].join('_'));
					}
				}
				//+++
				for (let i = 0; i < affected_leaves.length; i++) {
					stat_arr.push({ "number": item_counter, "X": current_coords[0], "Y": current_coords[1], "query_width": query_len_x,
													"query_height": query_len_y, "leaf": affected_leaves[i]['id'], "square_filled": affected_leaves[i]['area'],
												"n_objects": affected_leaves[i]['n_things'], "success": 1 });
				}
			} else {console.log("!Out of Plane!"); console.log(current_coords); console.log("____________");}

		}
	}
	//BBox
	//let bbox = svg_field.getBBox();
	//svg_field.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 20} ${bbox.height + 20}`);
	//Opacity, delete it next time
	matches = svg_field.querySelectorAll('.thing');
	for (let i=0; i < matches.length; i++) {
		matches[i].setAttribute("opacity", "1");
	};
	//+++
	return stat_arr;
}