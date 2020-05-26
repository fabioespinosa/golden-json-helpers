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

exports.add_jsons_fast = (json1, json2) => {
  json1 = json1 || {};
  json2 = json2 || {};
  const resulting_json = {};
  for (const [identifier, ls_ranges] of Object.entries(json1)) {
    if (typeof resulting_json[identifier] === 'undefined') {
      resulting_json[identifier] = ls_ranges;
    } else {
      resulting_json[identifier] = exports.add_ranges(
        resulting_json[identifier],
        ls_ranges
      );
    }
  }
  for (const [identifier, ls_ranges] of Object.entries(json2)) {
    if (typeof resulting_json[identifier] === 'undefined') {
      resulting_json[identifier] = ls_ranges;
    } else {
      resulting_json[identifier] = exports.add_ranges(
        resulting_json[identifier],
        ls_ranges
      );
    }
  }
  return resulting_json;
};

exports.add_ranges = (ranges1, ranges2) => {
  ranges1 = ranges1 || [];
  ranges2 = ranges2 || [];
  if (!Array.isArray(ranges1) || !Array.isArray(ranges2)) {
    throw `Ranges need to be arrays`;
  }
  if (ranges1.length === 0) {
    return ranges2;
  }

  const resulting_ranges = [];
  ranges2.forEach((range) => {
    const [start_lumisection, end_lumisection] = range;

    ranges1.forEach((old_range) => {
      const [start_lumisection_old, end_lumisection_old] = old_range;
      // If the new range is more specific, we stick with the old range:
      if (
        start_lumisection >= start_lumisection_old &&
        end_lumisection <= end_lumisection_old
      ) {
        // the new range is shorter, so we stick with the new range
        resulting_ranges.push(old_range);
      } else if (
        // If the new range contains the previous range
        start_lumisection <= start_lumisection_old &&
        end_lumisection >= end_lumisection_old
      ) {
        resulting_ranges.push(range);
      }
      // If there are some lumisections below (not included in current range) and then some above (included) with current range
      else if (
        start_lumisection <= start_lumisection_old &&
        end_lumisection >= start_lumisection_old
      ) {
        resulting_ranges.push([start_lumisection, end_lumisection]);
      }
      // If there are some lumisections in the current range and then some above, we stick with the stricter limit (the new lower limit) and the
      else if (
        start_lumisection <= end_lumisection_old &&
        end_lumisection >= end_lumisection_old
      ) {
        resulting_ranges.push([start_lumisection_old, end_lumisection]);
      }
    });
  });

  // Add the ones which didn't intersect anywhere
  const final_ranges = [...resulting_ranges];
  ranges2.forEach((range) => {
    const [start_lumisection, end_lumisection] = range;
    resulting_ranges.forEach((old_range, index) => {
      const [start_lumisection_old, end_lumisection_old] = old_range;
      if (index === 0) {
        if (end_lumisection < start_lumisection_old) {
          final_ranges.shift(range);
        }
      } else if (index === resulting_ranges.length - 1) {
        if (start_lumisection > end_lumisection_old) {
          final_ranges.push(range);
        }
      } else {
        const next_range = resulting_ranges[index + 1];
        const [start_next_range, end_next_range] = next_range;
        if (
          start_lumisection > end_lumisection_old &&
          end_lumisection < start_next_range
        ) {
          final_ranges.push(range);
        }
      }
    });
  });
  return final_ranges;
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
