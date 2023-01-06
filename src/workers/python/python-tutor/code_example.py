import json
from .pg_logger import exec_script_str_local

INDENT_LEVEL = 2

def json_finalizer(input_code, output_trace):
  ret = dict(code=input_code, trace=output_trace)
  # sort_keys=True leads to printing in DETERMINISTIC order, but might
  # screw up some old tests ... however, there is STILL non-determinism
  # in Python 3.3 tests, ugh!
  #
  # TODO: for Python 3.6, think about reinstating sort_keys=True as a
  # command-line option for tests only? maybe don't activate it for reals
  # since that might falsely give users the impression that object/dict keys
  # are always sorted
  json_output = json.dumps(ret, indent=INDENT_LEVEL)
  return json_output

def test_function(code: str, raw_input_lst_json: str | bool, dev: bool = False):
    res = exec_script_str_local(code, raw_input_lst_json, False, False, json_finalizer)
    if dev:
      print(res)
    return res