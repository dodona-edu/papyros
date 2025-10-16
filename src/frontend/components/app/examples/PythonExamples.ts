export const PYTHON_EXAMPLES = {
    "Hello, World!": "print('Hello, World!')",
    Input: `name = input('What is your name?')
print(f'Hello, {name}!')`,
    Fibonacci: `def fibonacci(n):
    return n if n <= 1 else fibonacci(n- 2) + fibonacci(n - 1)

print([fibonacci(n) for n in range(10)])`,
    Doctests: `def factorial(n):
    """Return the factorial of n, an exact integer >= 0.

    >>> [factorial(n) for n in range(6)]
    [1, 1, 2, 6, 24, 120]
    >>> factorial(30)
    265252859812191058636308480000000
    >>> factorial(-1)
    Traceback (most recent call last):
        ...
    ValueError: n must be >= 0

    Factorials of floats are OK, but the float must be an exact integer:
    >>> factorial(30.1)
    Traceback (most recent call last):
        ...
    ValueError: n must be exact integer
    >>> factorial(30.0)
    265252859812191058636308480000000

    It must also not be ridiculously large:
    >>> factorial(1e100)
    Traceback (most recent call last):
        ...
    OverflowError: n too large
    """

    import math
    if not n >= 0:
        raise ValueError("n must be >= 0")
    if math.floor(n) != n:
        raise ValueError("n must be exact integer")
    if n+1 == n:  # catch a value like 1e300
        raise OverflowError("n too large")
    result = 1
    factor = 2
    while factor <= n:
        result *= factor
        factor += 1
    return result

def wrong_factorial(n):
    """
    >>> [wrong_factorial(n) for n in range(6)]
    [1, 1, 2, 6, 24, 120]
    >>> wrong_factorial(30)
    265252859812191058636308480000000
    """
    return 0
`,
    Async: `import asyncio

async def nested():
    print(42)

async def main():
    # Schedule nested() to run soon concurrently
    # with "main()".
    task = asyncio.create_task(nested())

    # "task" can now be used to cancel "nested()", or
    # can simply be awaited to wait until it is complete:
    await task

await main()
`,
    Erroneous: `def bitonic_search(numbers, query):
    if not numbers:
        return -1
    if len(numbers) == 1:
        return 0 if numbers[0] == query else -1
    int top_index = find_max_index(numbers, 0, len(numbers))
    possible_position = find_bitonic_query(numbers,query,0,top_index+1, lambda a, b: a - b)
    if possible_position != -1:
        return possible_position
    else:
        return find_bitonic_query(numbers,query,top_index, len(numbers), lambda a, b: b - a)

def find_max_index(numbers, start, stop):
    while start <= stop:
        if stop - start <= 1:
            return start
        middle = (start + stop) / 2;
        if numbers[middle] < numbers[middle+1]:
            start = midden + 1
        else:
            stop = midden
        
def find_bitonic_query(numbers, query, start, stop, comp):
    while start <= stop:
        if stop - start <= 1:
            return start if numbers[start] == query else -1
        middle = (start + stop) / 2;
        if comp(numbers[midden], query) <= 0:
            start = midden
        else:
            stop = midden
`,
    Unicode: `import random
emoji = '🎅🤶👪🦌🌟❄️☃️🔥🎄🎁🧦🔔🎶🕯️🦆'
for _ in range(10):
    print(''.join(random.choice(emoji) for _ in range(30)))
`,
    Files: `with open("names.txt", "w") as out_file:
    for name in ["Alice", "Bob", "Claire"]:
        print(name, file=out_file)

with open("names.txt", "r") as in_file:
    for line in in_file:
        print(line.rstrip())
`,
    Matplotlib: `import matplotlib.pyplot as plt
import networkx as nx

plt.rcParams["font.size"] = 10
plt.figure()
plt.title('Random graph')

plt.tick_params(
    axis='both', left='off', top='off', right='off', 
    bottom='off', labelleft='off', labeltop='off', 
    labelright='off', labelbottom='off'
)
G = nx.random_geometric_graph(512, 0.125)
pos=nx.spring_layout(G)
nx.draw_networkx_edges(G, pos, alpha=0.2)
nx.draw_networkx_nodes(G, pos, node_color='r', node_size=12)

plt.show()
`,
    Sleep: `import time
text = """What is the air-speed velocity of an unladen swallow?
What do you mean? An African or European swallow?
What? I, I don't know that.
"""
for character in text:
    print(character, end="")
    time.sleep(0.1)
`,
    Overflow: `from functools import lru_cache

@lru_cache
def fibonacci(n):
    return n if n <= 1 else fibonacci(n- 2) + fibonacci(n - 1)

for index in range(5000):
    print(f'{index}: {fibonacci(index)}')
`,
    Interrupt: `i = 0
while i >= 0:
    print(i)
    i += 1
`,
};
