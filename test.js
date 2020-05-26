const test = require('ava');
const {
  ranges_in_one_but_not_in_other,
  convert_array_of_list_to_array_of_ranges,
  convert_array_of_ranges_to_array_of_list,
  get_lumisections_not_in_golden_json_but_in_denominator,
  add_jsons,
  add_jsons_fast,
} = require('./index');

test('golden-json-helpers working properly', (t) => {
  const excluded = [
    [1, 35],
    [37, 47],
    [49, 67],
    [69, 80],
    [82, 90],
  ];
  const denominator = [
    [1, 95],
    [100, 102],
  ];

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
    [100, 102],
  ];
  t.deepEqual(resulting_ranges, expected_ranges);
});

test('adding jsons', (t) => {
  const json1 = {
    '32322': [
      [1, 2],
      [343, 1233],
    ],
    '32323': [[222, 223]],
  };
  const json2 = {
    '32322': [
      [1, 3],
      [444, 2000],
      [6000, 6001],
    ],
    '222': [[1, 2]],
  };

  const resulting_json = add_jsons(json1, json2);
  t.deepEqual(resulting_json, {
    '32322': [
      [1, 3],
      [343, 2000],
      [6000, 6001],
    ],
    '32323': [[222, 223]],
    '222': [[1, 2]],
  });
});

test('adding jsons fast', (t) => {
  const json1 = {
    '32322': [
      [1, 2],
      [343, 1233],
    ],
    '32323': [[222, 223]],
  };
  const json2 = {
    '32322': [
      [1, 3],
      [444, 2000],
      [6000, 6001],
    ],
    '222': [[1, 2]],
  };
  const resulting_json = add_jsons_fast(json1, json2);
  console.log(resulting_json);
  t.deepEqual(resulting_json, {
    '32322': [
      [1, 3],
      [343, 2000],
      [6000, 6001],
    ],
    '32323': [[222, 223]],
    '222': [[1, 2]],
  });
});
