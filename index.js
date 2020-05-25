exports.get_lumisections_not_in_golden_json_but_in_denominator = (
  golden_json,
  denominator_json
) => {
  if (typeof golden_json === 'string') {
    golden_json = JSON.parse(golden_json);
  }
  if (typeof denominator_json === 'string') {
    denominator_json = JSON.parse(denominator_json);
  }
  const anti_json = {};
  for (const [run_number, denominator_ranges] of Object.entries(
    denominator_json
  )) {
    if (typeof golden_json[run_number] === 'undefined') {
      anti_json[run_number] = denominator_ranges;
    } else {
      const golden_ranges_of_run = golden_json[run_number];
      anti_json[run_number] = exports.ranges_in_one_but_not_in_other(
        denominator_ranges,
        golden_ranges_of_run
      );
    }
  }
  return anti_json;
};

exports.ranges_in_one_but_not_in_other = (preserve_ranges, excluded_ranges) => {
  const lumisections_in_preserve_ranges = [];
  const maximum_lumisection = preserve_ranges[preserve_ranges.length - 1][1]; // The maximum lumisection is the one in the last range
  const preserve_array_of_list = exports.convert_array_of_ranges_to_array_of_list(
    preserve_ranges
  );
  const excluded_array_of_list = exports.convert_array_of_ranges_to_array_of_list(
    excluded_ranges
  );

  for (let i = 1; i <= maximum_lumisection; i++) {
    const included_in_preserved = preserve_array_of_list.includes(i);
    const included_in_excluded = excluded_array_of_list.includes(i);
    if (included_in_excluded && !included_in_preserved) {
      throw `The denominator must be a subset of the excluded ranges`;
    }
    if (included_in_preserved && !included_in_excluded) {
      lumisections_in_preserve_ranges.push(i);
    }
  }
  return exports.convert_array_of_list_to_array_of_ranges(
    lumisections_in_preserve_ranges
  );
};

// We go from [[1,4], [10,12]] to [1,2,3,4,10,11,12]
exports.convert_array_of_ranges_to_array_of_list = (ranges) => {
  const array_of_list = [];
  ranges.forEach((range) => {
    const [start, end] = range;
    for (let i = start; i <= end; i++) {
      array_of_list.push(i);
    }
  });
  return array_of_list;
};

// We need to go from [1,2,3,4,10,11,12] to [[1,4], [10,12]]:
exports.convert_array_of_list_to_array_of_ranges = (list_of_lumisections) => {
  const array_of_ranges = [];
  list_of_lumisections.forEach((lumisection_number, index) => {
    if (array_of_ranges.length === 0) {
      array_of_ranges.push([lumisection_number, lumisection_number]);
    }
    // If we are not in the end of the array:
    if (index !== list_of_lumisections.length - 1) {
      // If the next lumisection is equal to the current lumisection +1 (they both belong to the same range)
      if (list_of_lumisections[index + 1] === lumisection_number + 1) {
        array_of_ranges[array_of_ranges.length - 1][1] = lumisection_number + 1;
      } else {
        // If not, we are at the end of the current range, therefore we need to insert a new range, starting from the next lumisection in the array which is +1 the current position:
        array_of_ranges.push([
          list_of_lumisections[index + 1],
          list_of_lumisections[index + 1],
        ]);
      }
    }
  });
  return array_of_ranges;
};

exports.convert_json_in_array_of_ranges_to_array_of_list = (json) => {
  const resulting_json = {};
  for (const [identifier, ls_ranges] of Object.entries(json)) {
    resulting_json[
      identifier
    ] = exports.convert_array_of_ranges_to_array_of_list(ls_ranges);
  }
  return resulting_json;
};

exports.add_jsons = (json1, json2) => {
  json1 = json1 || {};
  json2 = json2 || {};
  const hash_json = {};
  const json1_in_lists = exports.convert_json_in_array_of_ranges_to_array_of_list(
    json1
  );
  const json2_in_lists = exports.convert_json_in_array_of_ranges_to_array_of_list(
    json2
  );
  for (const [identifier, ls_list] of Object.entries(json1_in_lists)) {
    for (ls_index of ls_list) {
      hash_json[identifier] = { ...hash_json[identifier], [ls_index]: true };
    }
  }
  for (const [identifier, ls_list] of Object.entries(json2_in_lists)) {
    for (ls_index of ls_list) {
      hash_json[identifier] = { ...hash_json[identifier], [ls_index]: true };
    }
  }
  for (const [identifier, lumisection_booleans] of Object.entries(hash_json)) {
    hash_json[identifier] = exports.convert_array_of_list_to_array_of_ranges(
      Object.keys(lumisection_booleans).map((ls_index) => +ls_index)
    );
  }
  return hash_json;
};

// Ranges in one but not in other, using state machine
const experimental_state_machine_that_calculates_anges_in_one_but_not_in_other = (
  preserve_ranges,
  excluded_ranges
) => {
  const q = [];
  preserve_ranges.forEach((range) => {
    const [start, end] = range;

    q.push([start, 'begin', 'a']);
    q.push([end + 1, 'end', 'a']);
  });
  excluded_ranges.forEach((range) => {
    const [start, end] = range;

    q.push([start, 'begin', 'b']);
    q.push([end + 1, 'end', 'b']);
  });

  q.sort((a, b) => {
    if (a[0] < b[0]) {
      return -1;
    }
    if (a[0] > b[0]) {
      return 1;
    }
    return 0;
  });

  let state = 'none';
  let outputbegin = 0;
  let output = [];
  q.forEach((event) => {
    const [time, type, side] = event;
    switch ([state, type].join(',')) {
      case ['none', 'begin'].join(','):
        state = 'diff';
        outputbegin = time;
        break;
      case ['none', 'end'].join(','):
        assert(!'THIS SHOULD NEVER HAPPEN');
        break;
      case ['diff', 'begin'].join(','):
        if (outputbegin < time) {
          output.push([outputbegin, time - 1]);
        }
        state = 'union';
        break;
      case ['diff', 'end'].join(','):
        if (outputbegin < time) {
          output.push([outputbegin, time - 1]);
        }
        state = 'none';
        break;
      case ['union', 'begin'].join(','):
        assert(!'THIS SHOULD NEVER HAPPEN');
        break;
      case ['union', 'end'].join(','):
        state = 'diff';
        outputbegin = time;
        break;
    }
  });
  return output;
};
