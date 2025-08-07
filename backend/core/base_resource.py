"""Simple factory helpers to generate common list endpoints (GET /api/<model>)."""
from flask import request, jsonify
from typing import Callable, List, Any
from sqlalchemy.orm import Query

# Import query helper lazily to avoid circular deps
from utils.query_helpers import apply_search, apply_filters, apply_sort, paginate

def list_endpoint(model, schema_func: Callable[[Any], dict], search_columns: List[str], extra_filters: dict | None = None, base_query: Query | None = None):
    """Handle a generic paginated list response.

    Parameters
    ----------
    model : SQLAlchemy model class
    schema_func : callable that converts model instance to dict
    search_columns : list[str] columns to search via `search` param
    extra_filters : dict[str, Any] optional additional fixed filters applied to the query
    base_query : optional pre-filtered query to start from (defaults to model.query)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    sort_by = request.args.get('sort_by', search_columns[0] if search_columns else 'id')
    sort_order = request.args.get('sort_order', 'asc')

    # Build initial query
    query = base_query or model.query

    # Apply dynamic filters from query params (except known params)
    ignore_keys = {'page', 'per_page', 'search', 'sort_by', 'sort_order'}
    dynamic_filters = {k: v for k, v in request.args.items() if k not in ignore_keys and v}

    if extra_filters:
        dynamic_filters.update(extra_filters)

    query = apply_search(query, model, search, search_columns)
    query = apply_filters(query, model, dynamic_filters)
    query = apply_sort(query, model, sort_by, sort_order)

    pagination = paginate(query, page, per_page)

    return jsonify({
        'items': [schema_func(item) for item in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    })
