"""Utility functions to reduce duplicate pagination / filtering / sorting code.

The helpers are intentionally simple – they only cover the 90 % common logic we use
in list endpoints (storage, records, inventory, …).  Additional bespoke logic can
still live inside individual route handlers.
"""
from typing import List, Dict, Any, Tuple, Optional

from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Query as BaseQuery


def apply_search(query: BaseQuery, model, search_term: str, search_columns: List[str]):
    """Apply a case-insensitive partial-match filter across multiple columns.

    Parameters
    ----------
    query : SQLAlchemy query object
    model : SQLAlchemy model class (declared model)
    search_term : str – the raw search string (will be trimmed)
    search_columns : list[str] – attribute names on *model* that participate in search
    """
    term = search_term.strip()
    if not term:
        return query

    wild = f"%{term}%"
    or_clauses = []
    for col_name in search_columns:
        if hasattr(model, col_name):
            or_clauses.append(getattr(model, col_name).ilike(wild))
    if or_clauses:
        query = query.filter(or_(*or_clauses))
    return query


def apply_filters(query: BaseQuery, model, filters: Dict[str, Any]):
    """Apply simple equality / partial-match filters where value is truthy.

    For each (field,value) pair:
      • if the column exists on *model*
      • if *value* is not empty
      • a case-insensitive ilike is applied for strings, equality for others
    """
    for field, value in filters.items():
        if value in (None, ""):
            continue
        if not hasattr(model, field):
            continue
        column = getattr(model, field)
        if isinstance(value, str):
            query = query.filter(column.ilike(f"%{value}%"))
        else:
            query = query.filter(column == value)
    return query


def apply_sort(query: BaseQuery, model, sort_by: str, sort_order: str = "asc"):
    """Apply dynamic ORDER BY if the column exists, defaulting to asc/desc."""
    if not hasattr(model, sort_by):
        return query  # silently ignore
    column = getattr(model, sort_by)
    if sort_order and sort_order.lower() == "desc":
        query = query.order_by(desc(column))
    else:
        query = query.order_by(asc(column))
    return query


def paginate(query: BaseQuery, page: int, per_page: int):
    """Simple thin wrapper around `query.paginate` that never raises `404`."""
    return query.paginate(page=page, per_page=per_page, error_out=False)
