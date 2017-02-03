"""This module contains a common set of configuration variables.

These variables can be used anywhere throughout the program, and are
per-server. They are generally database field lengths.
"""

COMMON_NAME_MAX_LEN = 80  # characters

CARD_TYPE_FIELD_NAME_MAX_LEN = COMMON_NAME_MAX_LEN
CARD_TYPE_VIEW_NAME_MAX_LEN = COMMON_NAME_MAX_LEN
CARD_TYPE_NAME_MAX_LEN = COMMON_NAME_MAX_LEN

CARD_FIELD_VALUE_FIELD_MAX_LEN = CARD_TYPE_FIELD_NAME_MAX_LEN
CARD_FIELD_VALUE_VALUE_MAX_LEN = 80  # characters

DECK_NAME_MAX_LEN = COMMON_NAME_MAX_LEN

STORMPATH_ID_MAX_LEN = 21  # characters
