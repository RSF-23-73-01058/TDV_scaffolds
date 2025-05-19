// Function to build the barchart
async function charter (chart_field, results, field_width, field_height, fetch_confidence){
	//Async function to decompress the string and extract object with values
	async function decompress_string (compressed_string, size) {
		const str_byteCharacters = atob(compressed_string);
		const str_byteNumbers = new Array(str_byteCharacters.length);
		for (let i = 0; i < str_byteCharacters.length; i++) {
				str_byteNumbers[i] = str_byteCharacters.charCodeAt(i);
		}
		const str_byteArray = new Uint8Array(str_byteNumbers, size);
		const str_blob = new Blob([str_byteArray], {type: ""});
		const str_processing_stream = new DecompressionStream("deflate");
		const str_processed_stream = str_blob.stream().pipeThrough(str_processing_stream);
		let str = await new Response(str_processed_stream).json();
		str = str[size-1];
		return str;
	}

	//Know the number of structures and scaffold type
	const scaff_type_inner = results['meta']['scaffold_type'];
	console.log("scaff_type_inner:");
	console.log(scaff_type_inner);
	const n_structs_processed = results['meta']['processed'];
	//Get the confidence intervals
	let compressed_ci;
	if (scaff_type_inner == 'non-generic') {
		compressed_ci = ( await fetch_confidence('CIs/CIs.JSON') )['cis'];
	} else {
		compressed_ci = ( await fetch_confidence('CIs/CIs_gen.JSON') )['cis'];
	}
	//Get the set speciffic confidence intervals
	const current_ci = await decompress_string(compressed_ci, n_structs_processed);
	console.log(current_ci);
	//Prepare for coloring
	const n_structs_acyclic = results['counts']['acyclic_count'];
	const n_structs_unknown = results['counts']['unknown_count'];
	const n_structs_having_scaff = n_structs_processed - n_structs_acyclic - n_structs_unknown;
	//Function to get the color
	function color_giver (nStructs_for_nScaffs, set_to_store_legend){
		let color = '#800000ff';
		switch (true) {
			case (nStructs_for_nScaffs <= 10):
				color = '#bbdefb';
				color_set.add(color +'| [1, 10]');
				break;
			case (nStructs_for_nScaffs > 10 && nStructs_for_nScaffs <= 100):
				color = '#64b5f6';
				color_set.add(color +'| (10, 100]');
				break;
			case (nStructs_for_nScaffs > 100 && nStructs_for_nScaffs <= 1000):
				color = '#2196f3';
				color_set.add(color +'| (100, 1000]');
				break;
			case (nStructs_for_nScaffs > 1000):
				color = '#1565c0';
				color_set.add(color +'| >1000');
				break;
		}
		return color;
	}
	//Set to store the legend
	const color_set = new Set();
	//Array of ticks
	const ticks_arr = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
	//Access the heights
	const bar_counts = Object.entries(results['counts']['bar_counts']);
	let elem_x = field_width / 26.5;
	let base_y = field_height / 13.5;
	let elem_width = field_width / 20;
	//Add axes and all
	const y_axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	y_axis.setAttribute('stroke', 'black');
	y_axis.setAttribute('x1', +field_width / 40);
	y_axis.setAttribute('y1', +(field_height - base_y));
	y_axis.setAttribute('x2', field_width / 40);
	y_axis.setAttribute('y2', '0');
	chart_field.appendChild(y_axis);
	//Create and add ticks
	for (var t = ticks_arr.length - 1; t >= 0; t--) {
		//Prepare y positions
		y_val = ticks_arr[t] > 0 ? (field_height - Math.sqrt(ticks_arr[t]) * (field_height - base_y) - base_y) : field_height - base_y;
		//Make ticks and labels
		let y_tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		let y_label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		y_label.innerHTML = ticks_arr[t].toFixed(2).replace(/^0/, "").replace(/0\b/, "");
		y_label.setAttribute('font-size', '1em');
		y_label.setAttribute('id', 'y_label');
		y_label.setAttribute('x', -20);
		y_label.setAttribute('y', +	y_val);
		y_tick.setAttribute('stroke', 'black');
		y_tick.setAttribute('x1', +field_width / 40);
		y_tick.setAttribute('y1', +y_val);
		y_tick.setAttribute('x2', +field_width / 80);
		y_tick.setAttribute('y2', +y_val);
		chart_field.appendChild(y_tick);
		chart_field.appendChild(y_label);
	}
	const x_axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	x_axis.setAttribute('stroke', 'black');
	x_axis.setAttribute('x1', +field_width / 40);
	x_axis.setAttribute('y1', +(field_height - base_y + 2));
	x_axis.setAttribute('x2', +((elem_width+(field_width/40))*13+(field_width/80)));
	x_axis.setAttribute('y2', +(field_height - base_y + 2));
	chart_field.appendChild(x_axis);
	//Add the elements
	for (const [key, value] of bar_counts) {
		//Create elem and get its height
		let bar_elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		let elem_height = Math.sqrt(value) * (field_height - base_y);
		elem_y = field_height - elem_height - base_y;
		//Get the elem's color
		let color = color_giver( n_structs_having_scaff * value );
		bar_elem.setAttribute('fill', color);
		bar_elem.setAttribute('x', +elem_x);
		bar_elem.setAttribute('y', +elem_y);
		bar_elem.setAttribute('width', +elem_width);
		bar_elem.setAttribute('height', +elem_height);
		chart_field.appendChild(bar_elem);
		let label_elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		let label = "";
		switch (key) {
			case "interval_1":
				label = "1";
				break;
			case "interval_2":
				label = "2";
				break;
			case "interval_3":
				label = "3";
				break;
			case "interval_4":
				label = "4";
				break;
			case "interval_5":
				label = "5";
				break;
			case "interval_6":
				label = "6";
				break;
			case "interval_7":
				label = "7";
				break;
			case "interval_8":
				label = "8";
				break;
			case "interval_9":
				label = "9";
				break;
			case "interval_10":
				label = "10";
				break;
			case "interval_11":
				label = "(10, 100]";
				break;
			case "interval_12":
				label = "(100, 1000]";
				break;
			case "interval_13":
				label = "(1000, 10000]";
				break;
		}
		label_elem.innerHTML = label;
		label_elem.setAttribute('font-size', '1em');
		label_elem.setAttribute('id', key);
		label_elem.setAttribute('x', +elem_x);
		label_elem.setAttribute('y', +(field_height - base_y + field_height / 15));
		chart_field.appendChild(label_elem);
		//SVG needs to be drawn to adjust the labels positions 
		//Move to the next position
		elem_x = elem_x + field_width / 13.5;
	}
	//Add the CIs
	let ci_x_start = field_width / 26.5 - field_width / 160;
	let ci_x_end = ci_x_start + field_width / 20 + field_width / 80;
	let ci_name_lower;
	let ci_name_upper;
	let stroke_width = field_width / 350;
	for (let i = 1; i <= 13; i++) {
		ci_name_lower = "lower_" + i;
		ci_name_upper = "upper_" + i;
		if (current_ci[ci_name_upper] > 0) {
			//Create CI elem and get its height
			let ci_elem_lower = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			let ci_elem_upper = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			chart_field.appendChild(ci_elem_lower);
			chart_field.appendChild(ci_elem_upper);
			let ci_upper = Math.sqrt(current_ci[ci_name_upper])  * (field_height - base_y);
			let ci_lower = Math.sqrt(current_ci[ci_name_lower])  * (field_height - base_y); 
			let ci_upper_y = field_height - ci_upper - base_y;
			let ci_lower_y = field_height - ci_lower - base_y;
			//CI elem properties
			ci_elem_lower.setAttribute('stroke', '#212121');
			ci_elem_lower.setAttribute('stroke-width', +stroke_width);
			ci_elem_lower.setAttribute('x1', +ci_x_start);
			ci_elem_lower.setAttribute('x2', +ci_x_end);
			ci_elem_lower.setAttribute('y1', +ci_lower_y);
			ci_elem_lower.setAttribute('y2', +ci_lower_y);
			ci_elem_upper.setAttribute('stroke', '#212121');
			ci_elem_upper.setAttribute('stroke-width', +stroke_width);
			ci_elem_upper.setAttribute('x1', +ci_x_start);
			ci_elem_upper.setAttribute('x2', +ci_x_end);
			ci_elem_upper.setAttribute('y1', +ci_upper_y);
			ci_elem_upper.setAttribute('y2', +ci_upper_y);
		}
		//Step to the right
		ci_x_start = ci_x_start + field_width / 13.5;
		ci_x_end = ci_x_end + field_width / 13.5;
	}
	//Add color legend
	let color_legend_pos_x = field_width;
	let color_legend_pos_y = field_height/3;
	for (const value of [...color_set]) {
		let color_color = value.replace(/\|.*/, "");
		let color_text  = value.replace(/.*\|/, "");
		let square_elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		square_elem.setAttribute('fill', color_color);
		square_elem.setAttribute('x', color_legend_pos_x);
		square_elem.setAttribute('y', color_legend_pos_y);
		square_elem.setAttribute('width', +elem_width);
		square_elem.setAttribute('height', +elem_width);
		chart_field.appendChild(square_elem);
		let square_legend = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		square_legend.innerHTML = color_text;
		square_legend.setAttribute('font-size', '1em');
		square_legend.setAttribute('x', +(color_legend_pos_x + elem_width*1.2));
		square_legend.setAttribute('y', +(color_legend_pos_y + elem_width*0.6));
		chart_field.appendChild(square_legend);
		color_legend_pos_y = color_legend_pos_y + elem_width*1.2;
	}
}

//Function to generate the description
function describe_results (description_field, results) {
	const description = "T E S T: Scaffolds' diversity of the set of chemical structures is depicted on the upper panel. Length of the C-C bond is proportional to the scaffold's abundance. Lower panel extends this characteristic with the numerical values: bars' heights (Y axis) equal to the proportion of the scaffolds describing the given number of chemical structures (Y axis) among all the scaffolds, bars' color codifies the the total number of the related structures (see the color legend on the right). " +results['meta']['processed']+ " structures were successfully processed on the server after the preliminary filtration. " +results['counts']['acyclic_count']+ " - acyclic, i.e. did not have a scaffold; " +results['meta']['failed_bond']+ " - rejected due to the problems with bonds, " +results['meta']['failed_mw']+ " - rejected due to the problems with the molecular weight " +results['meta']['failed_parse']+ " - non-parsable, " +results['meta']['repeats']+ " - not unique. Horizontal lines correspond to the lower and upper bounds of the confidence intervals (95%) obtained for the random sample of " +results['meta']['processed']+ " chemical structures from ChEMBL & PubChem combined.";
	let p = document.createElement('p');
	p.innerHTML = description;
	p.id = "description_paragraph";
	description_field.appendChild(p);
}