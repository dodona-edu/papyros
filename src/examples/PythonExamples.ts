export const PYTHON_EXAMPLES = {
    "Hello, World!": "print('Hello, World!')",
    "Input":
        `name = input('What is your name?')
print(f'Hello, {name}!')`,
    "Fibonacci":
        `def fibonacci(n):
    return n if n <= 1 else fibonacci(n- 2) + fibonacci(n - 1)

print([fibonacci(n) for n in range(10)])`,
    "Doctests":
        `def factorial(n):
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

if __name__ == "__main__":
    import doctest
    doctest.testmod()
`,
    "Async":
        `async def main():
    import micropip
    await micropip.install('snowballstemmer')
    import snowballstemmer
    stemmer = snowballstemmer.stemmer('english')
    print(stemmer.stemWords('go goes going gone'.split()))

await main()`,
    "Erroneous":
        `def bitonic_search(numbers, query):
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
    "Unicode":
        `import random
emoji = '🎅🤶👪🦌🌟❄️☃️🔥🎄🎁🧦🔔🎶🕯️🦆'
for _ in range(10):
    print(''.join(random.choice(emoji) for _ in range(30)))
`,
    "Files":
        `with open("names.txt", "w") as out_file:
    for name in ["Alice", "Bob", "Claire"]:
        print(name, file=out_file)

with open("names.txt", "r") as in_file:
    for line in in_file:
        print(line.rstrip())
`,
    "Matplotlib":
        `import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 1000)
plt.plot(x, np.sin(x));

plt.show()
`,
    "Sleep": `import time
print("See you in a second!")
time.sleep(1)
print("Good to see you again!")
`
};
