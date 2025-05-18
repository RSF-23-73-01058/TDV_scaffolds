//Function to populate the table, SEE: https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement/insertRow
const update_table = async function (table, data_map, names_arr) {
	//Clear table
	const old_rows = document.querySelectorAll("tbody tr");
	await old_rows.forEach((row) => {
		row.remove();
	});
	//Populate table
	for (const [key, value] of data_map) {
		if ( value['state'] == 1 ) {
			let new_row = table.insertRow(-1);
			for (let i = 0; i < names_arr.length; i++) {
				//Create cell
				let new_cell = new_row.insertCell(i);
				//Create text
				let new_text = document.createTextNode(value[names_arr[i]]);
				//Append text
				new_cell.appendChild(new_text);
				//Add class to shorten the smiles
				new_cell.classList.add("overflow-ellipsis");
			}
		}
	}
}


//Function to filter the table by numeric property
const filter_property = async function (filter_supplier, table, data_map, names_arr ) {
	let composite;
	let lower;
	let upper;
	let lower_bound;
	let upper_bound;
	let lower_type; // 0: >   1: >= 
	let upper_type; // 0: <   1: <=
	let lower_val;
	let upper_val;
	event.preventDefault();
	let full_criterion = filter_supplier.value;
	//Detect if both lower and upper bounds are given
	composite = full_criterion.includes("&") ? 1 : 0;
	//Process accordingly:
	if (composite === 1) {
		//Get filtering components, only first two components will be used
		let criterion_component_1 = full_criterion.split('&')[0].trim()
		let criterion_component_2 = full_criterion.split('&')[1].trim()
		//Get the lower bound;
		lower_bound = criterion_component_1.includes(">") ? criterion_component_1 : 0;
		lower_bound = criterion_component_2.includes(">") ? criterion_component_2 : lower_bound;
		//Return if there is no lower bound
		if (lower_bound === 0) {
			new M.Toast({html: `ERROR: no lower bound detected in composite filtering criterion`});
			return;
		}
		//Get the upper bound;
		upper_bound = criterion_component_1.includes("<") ? criterion_component_1 : 0;
		upper_bound = criterion_component_2.includes("<") ? criterion_component_2 : upper_bound;
		//Return if there is no lower bound
		if (upper_bound === 0) {
			new M.Toast({html: `ERROR: no upper bound detected in composite filtering criterion`});
			return;
		}
		//Detect bounds' type
		lower_type = lower_bound.includes("=") ? 1 : 0;
		upper_type = upper_bound.includes("=") ? 1 : 0;
		//Get exact values
		//lower
		if (lower_bound.includes(".")) {
			lower_val = Math.round(( parseFloat(lower_bound.match(/[\d]+\.\d+/)[0]) + Number.EPSILON) * 1000) / 1000;
		} else {
			lower_val = parseFloat(lower_bound.match(/[\d]+/)[0]);
		}
		//upper
		if (upper_bound.includes(".")) {
			upper_val = Math.round(( parseFloat(upper_bound.match(/[\d]+\.\d+/)[0]) + Number.EPSILON) * 1000) / 1000;
		} else {
			upper_val = parseFloat(upper_bound.match(/[\d]+/)[0]);
		}
		//Filter (not really) the MAP: change state of the scaffolds from 1 to 0, no metaprogramming in browser
		for (const [key, value] of data_map) {
			if ( value['state'] == 1 ) {
				//Filter lower according to type
				if (lower_type === 1 && value['mean_property'] <= lower_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');
				}
				if (lower_type === 0 && value['mean_property'] < lower_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');		
				}
				//Filter upper according to type
				if (upper_type === 1 && value['mean_property'] >= upper_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');		
				}
				if (upper_type === 0 && value['mean_property'] > upper_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');	
				}
			}
		}

	} else {
		//Decide lower OR upper
		lower = full_criterion.includes(">") ? 1 : 0;
		upper = full_criterion.includes("<") ? 1 : 0;
		//Smth is wrong
		if (lower === 1 && upper === 1) {
			new M.Toast({html: `ERROR: "&" is missing in composite filtering criterion`});
		}
		//Process lower
		if (lower === 1 && upper === 0) {
			lower_bound = full_criterion;
			//Detect bound's type
			lower_type = lower_bound.includes("=") ? 1 : 0;
			//Get exact value
			if (lower_bound.includes(".")) {
				lower_val = Math.round(( parseFloat(lower_bound.match(/[\d]+\.\d+/)[0]) + Number.EPSILON) * 1000) / 1000;
			} else {
				lower_val = parseFloat(lower_bound.match(/[\d]+/)[0]);
			}
			//Filter (not really): make scaffolds invisible, no metaprogramming in browser
			for (const [key, value] of data_map) {
				if (lower_type === 1 && value['mean_property'] <= lower_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');
				}
				if (lower_type === 0 && value['mean_property'] < lower_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');		
				}
			}
		}
		//Process upper
		if (lower === 0 && upper === 1) {
			upper_bound = full_criterion;
			//Detect bound's type
			upper_type = upper_bound.includes("=") ? 1 : 0;
			//Get exact value
			if (upper_bound.includes(".")) {
				upper_val = Math.round(( parseFloat(upper_bound.match(/[\d]+\.\d+/)[0]) + Number.EPSILON) * 1000) / 1000;
			} else {
				upper_val = parseFloat(upper_bound.match(/[\d]+/)[0]);
			}
			//Filter (not really): make scaffolds invisible, no metaprogramming in browser
			for (const [key, value] of data_map) {
				if (upper_type === 1 && value['mean_property'] >= upper_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');
				}
				if (upper_type === 0 && value['mean_property'] > upper_val) {
					let scaff_to_disable = document.getElementById(key);
					scaff_to_disable.classList.remove('enabled_thing');		
				}
			}
		}
	}
	//Update the table
	await update_table(table, data_map, names_arr);

}