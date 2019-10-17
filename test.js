import test from 'ava';
import {
    ranges_in_one_but_not_in_other,
    convert_array_of_list_to_array_of_ranges,
    convert_array_of_ranges_to_array_of_list,
    get_lumisections_not_in_golden_json_but_in_denominator
} from '.';

test('golden-json-helpers working properly', t => {
    const excluded = [[1, 35], [37, 47], [49, 67], [69, 80], [82, 90]];
    const denominator = [[1, 95], [100, 102]];

    const resulting_ranges = ranges_in_one_but_not_in_other(
        denominator,
        excluded
    );
    const expected_ranges = [
        [36, 36],
        [48, 48],
        [68, 68],
        [81, 81],
        [91, 95],
        [100, 102]
    ];
    t.deepEqual(resulting_ranges, expected_ranges);
});
