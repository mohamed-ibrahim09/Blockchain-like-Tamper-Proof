import re


DEFAULT_PLAYFAIR_KEY = "SECURITY"


def build_matrix(key: str):
    normalized_key = re.sub(r"[^A-Z]", "", key.upper()).replace("J", "I")
    if not normalized_key:
        raise ValueError("Playfair key must contain at least one alphabetic character.")

    seen, grid = set(), []
    for character in normalized_key + "ABCDEFGHIKLMNOPQRSTUVWXYZ":
        if character not in seen:
            seen.add(character)
            grid.append(character)
    positions = {character: divmod(index, 5) for index, character in enumerate(grid)}
    return grid, positions


def prepare_bigrams(text: str):
    cleaned = re.sub(r"[^A-Z]", "", text.upper()).replace("J", "I")
    if not cleaned:
        raise ValueError("Playfair text must contain at least one alphabetic character.")

    bigrams = []
    index = 0
    while index < len(cleaned):
        first = cleaned[index]
        if index + 1 == len(cleaned):
            bigrams.append((first, "X"))
            break

        second = cleaned[index + 1]
        if first == second:
            bigrams.append((first, "X"))
            index += 1
        else:
            bigrams.append((first, second))
            index += 2
    return bigrams


def encrypt(text: str, key: str):
    grid, positions = build_matrix(key)
    bigrams = prepare_bigrams(text)
    output: list[str] = []

    for first, second in bigrams:
        row_a, col_a = positions[first]
        row_b, col_b = positions[second]

        if row_a == row_b:
            output.append(grid[row_a * 5 + (col_a + 1) % 5])
            output.append(grid[row_b * 5 + (col_b + 1) % 5])
        elif col_a == col_b:
            output.append(grid[((row_a + 1) % 5) * 5 + col_a])
            output.append(grid[((row_b + 1) % 5) * 5 + col_b])
        else:
            output.append(grid[row_a * 5 + col_b])
            output.append(grid[row_b * 5 + col_a])

    return "".join(output)


def decrypt(text: str, key: str):
    normalized_text = re.sub(r"[^A-Z]", "", text.upper()).replace("J", "I")
    if not normalized_text or len(normalized_text) % 2 != 0:
        raise ValueError("Playfair ciphertext must contain an even number of alphabetic characters.")

    grid, positions = build_matrix(key)
    bigrams = [(normalized_text[index], normalized_text[index + 1]) for index in range(0, len(normalized_text), 2)]
    output: list[str] = []

    for first, second in bigrams:
        row_a, col_a = positions[first]
        row_b, col_b = positions[second]

        if row_a == row_b:
            output.append(grid[row_a * 5 + (col_a - 1) % 5])
            output.append(grid[row_b * 5 + (col_b - 1) % 5])
        elif col_a == col_b:
            output.append(grid[((row_a - 1) % 5) * 5 + col_a])
            output.append(grid[((row_b - 1) % 5) * 5 + col_b])
        else:
            output.append(grid[row_a * 5 + col_b])
            output.append(grid[row_b * 5 + col_a])

    return "".join(output)


def playfair_algorithm(text: str, key: str = DEFAULT_PLAYFAIR_KEY):
    try:
        return encrypt(text, key)
    except (TypeError, ValueError):
        return "[ERROR]"


def playfair_decrypt(text: str, key: str = DEFAULT_PLAYFAIR_KEY):
    try:
        return decrypt(text, key)
    except (TypeError, ValueError):
        return "[ERROR]"
