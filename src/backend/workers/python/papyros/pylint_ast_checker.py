# source: https://github.com/dodona-edu/judge-pythia/blob/e41f6e943830f5f9b5aebe689140ec7ec53383c9/pylint_ast_checker.py
import astroid
from pylint.checkers import BaseChecker
from pylint.checkers.utils import check_messages
from pylint.interfaces import IAstroidChecker

class NoOpChecker(BaseChecker):

    __implements__ = IAstroidChecker

    name = 'no_op_checker'

    msgs = {
        'C0001': (
            'Useless pass statement in body of conditional statement',
            'no-op-pass',
            'Used when a useless pass statement is encountered in the body of an if statement.'
        ),
        'C0002': (
            'Useless equality test: if xxx == True',
            'no-op-if-true',
            'Used when an equality test of the form xxx == True is encountered. Can be replaced by xxx.'
        ),
        'C0003': (
            'Useless increment: xxx += 0',
            'no-op-increment-zero',
            'Used when an increment with zero is encountered.'
        ),
        'C0004': (
            "Useless increment: xxx += ''",
            'no-op-increment-empty',
            'Used when an increment with an empty string is encountered.'
        ),
        'C0005': (
            'Useless statement: xxx *= 1',
            'no-op-multiply-one',
            'Used when a multiplication with one is encountered'
        ),
        'C0006': (
            'Useless assignment: <x> = <x>',
            'no-op-useless-assign',
            'Used when a variable is assigned to itself'
        )
    }

    @check_messages('no-op-pass')
    def visit_pass(self, node):
        
        if isinstance(node.parent, astroid.If):
            if len(node.parent.orelse) > 0 and node.parent.orelse[0] is node:
                self.add_message('no-op-pass', node=node)

    @check_messages('no-op-if-true')
    def visit_if(self,node):
        
        if (
            isinstance(node.test, astroid.Compare) and 
            any(operation =='==' for operation,_ in node.test.ops) and
            any(isinstance(operand, astroid.Const) and 
            operand.value is True for operand in node.test.get_children())
        ):
            self.add_message('no-op-if-true', node=node)

    @check_messages('no-op-increment-zero', 'no-op-increment-empty', 'no-op-multiply-one')
    def visit_augassign(self,node):
        
        if node.op == '+=' and isinstance(node.value, astroid.Const):
            if node.value.value == 0:
                self.add_message('no-op-increment-zero', node=node)
            elif node.value.value == '':
                self.add_message('no-op-increment-empty',node=node)
        elif (
            node.op =='*=' and 
            isinstance(node.value, astroid.Const) and 
            node.value.value == 1
        ):
            self.add_message('no-op-multiply-one', node=node)

    @check_messages('no-op-useless-assign')
    def visit_assign(self,node):
        
        # only keep variables, e.g. [x, y, 2] -> [x, y]
        child_names = [
            child.name for child in node.get_children() 
            if (
                isinstance(child,astroid.Name) or 
                isinstance(child, astroid.AssignName)
            )
        ]
        
        if len(child_names) > len(set(child_names)):
            # at least two names were equal (e.g. ['x', 'y', 'x')
            self.add_message('no-op-useless-assign', node=node)

class RewriteChecker(BaseChecker):

    __implements__ = IAstroidChecker
    
    name = 'rewrite_checker'

    msgs = {
        'C0007': (
            'Useless pass statement: rewrite the if statement as\n%s',
            'rewrite-if-pass',
            'Used when statement "if: pass else" is encountered'
        ),
        'C0008': (
            'Self-assignment: use the equivalent shorthand notation\n%s',
            'rewrite-assign',
            'Used when assignment statement of the form "x = x + 1" is encountered. Could be rewritten as: x += 1'
        )
    }

    inverse_operators = {
        '==':'!=',
        '!=':'==',
        '<': '>=',
        '>': '<=',
        '<=': '>',
        '>=':'<',
        'in':'not in',
        'not in':'in',
        'is':'is not',
        'is not': 'is'
    }

    @check_messages('rewrite-if-pass')
    def visit_if(self,node):
        
        # check whether the body of the if clause starts with the pass statement
        # and there is an else clause
        if isinstance(node.body[0], astroid.Pass) and len(node.orelse) > 0:
            
            # swap body of the else clause in the if clause and remove the else 
            # clause
            node.body = node.orelse
            node.orelse = []
            
            # invert the test
            # TODO: could be improved for recursive statements, etc.
            if (
                isinstance(node.test, astroid.Compare) and 
                len(node.test.ops) == 1
            ):
                node.test.ops[0] = (
                    self.inverse_operators[node.test.ops[0][0]],
                    node.test.ops[0][1]
                )
            elif (
                isinstance(node.test, astroid.UnaryOp) and 
                node.test.op == 'not'
            ): 
                # not <x> becomes <x>
                node.test = node.test.operand
            else:
                old_test, node.test = node.test, astroid.UnaryOp()
                node.test.op, node.test.operand = 'not', old_test
                
            # add message with corrected node as argument
            self.add_message(
                'rewrite-if-pass', 
                node=node,
                args=node.as_string()
            )

    @check_messages('rewrite-assign')
    def visit_assign(self,node):
        
        # TODO: current implementation does not rewrite assignment statements
        #       having multiple targets or recursive binary operations
        #       (eg. x = x + 5 + 6)
        if len(node.targets) == 1:
            
            target = node.targets[0]
            
            if isinstance(node.value, astroid.BinOp):
                
                rewrite = False
                
                # e.g. x = x + 4
                if (
                    isinstance(node.value.left, astroid.Name) and 
                    isinstance(target, astroid.AssignName) and
                    node.value.left.name == target.name
                ):
                    rewrite = True

                # check for binary operations of the form x["y"] = x["y"] + 5
                elif (
                    isinstance(node.value.left, astroid.Subscript) and 
                    isinstance(target, astroid.Subscript) and
                    isinstance(node.value.left.value, astroid.Name) and 
                    isinstance(target.value, astroid.Name) and
                    node.value.left.value.name == target.value.name and
                    isinstance(node.value.left.slice, astroid.Index) and 
                    isinstance(target.slice, astroid.Index)
                ):
                        # e.g. x[y] = x[y] + 1 (where y is a variable)
                        if (
                            isinstance(node.value.left.slice.value, astroid.Name) and 
                            isinstance(target.slice.value, astroid.Name) and 
                            node.value.left.slice.value.name == target.slice.value.name
                        ):
                            rewrite = True
                        # e.g. x[0] = x[0] + 1 or x["y"] = x["y"] + 1
                        elif (
                            isinstance(node.value.left.slice.value, astroid.Const) and 
                            isinstance(target.slice.value, astroid.Const) and 
                            node.value.left.slice.value.value == target.slice.value.value
                        ):
                            rewrite = True

                if rewrite:
                    
                    newnode = astroid.AugAssign()
                    newnode.target = target
                    # node.value.op is of the form '+', '-' , '/' , '*'
                    newnode.op = node.value.op + '=' 
                    newnode.value = node.value.right
                    self.add_message(
                        'rewrite-assign',
                        node=node,
                        args=newnode.as_string()
                    )

class UnnecessaryConversionChecker(BaseChecker):
    
    __implements__ = IAstroidChecker
    
    name = 'un_conv_checker'
    
    msgs = {
        'C0009': (
            'Useless call to int(): no type conversion required.',
            'un-conv-int',
            'Used when calling int() on an integer constant.'
        ),
        'C0010': (
            'Useless call to float(): no type conversion required.',
            'un-conv-float',
            'Used when calling float() on a float constant.'
        ),
        'C0011': (
            'Useless call to str(), no type conversion required.',
            'un-conv-str',
            'Used when calling str() on the return value of the input() function or on a string constant.'
        )
    }

    @check_messages('un-conv-int', 'un-conv-float', 'un-conv-str')
    def visit_callfunc(self, node):
        
        #check if 'regular' function:
        if  hasattr(node.func, 'name'):

            # case: str(input(...))
            if (
                # check if parent is str()
                node.func.name == 'input' and
                isinstance(node.parent, astroid.Call) and
                hasattr(node.parent.func, 'name') and
                node.parent.func.name == 'str' and
                # limited to a single argument
                len(node.parent.args) == 1
            ):
                self.add_message('un-conv-str', node=node.parent)
            
            # check if a single constant argument is passed
            elif (
                len(node.args) == 1 and
                isinstance(node.args[0], astroid.Const)
            ):
                # case: int(<builtin.int>)
                if (
                    node.func.name == 'int' and
                    node.args[0].pytype() == 'builtins.int'
                ):
                    self.add_message('un-conv-int', node=node)
                # case: float(<builtin.float>)
                elif (
                    node.func.name == 'float' and
                    node.args[0].pytype() == 'builtins.float'
                ):
                    self.add_message('un-conv-float', node=node)
                # case: string(<builtin.str>)
                elif (
                    node.func.name == 'str' and
                    node.args[0].pytype() == 'builtins.str'
                ):
                    self.add_message('un-conv-str', node=node)

def register(linter):
    
    """
    Required method to auto register custom checkers to pylint.
    """
    
    linter.register_checker(NoOpChecker(linter))
    linter.register_checker(RewriteChecker(linter))
    linter.register_checker(UnnecessaryConversionChecker(linter))
