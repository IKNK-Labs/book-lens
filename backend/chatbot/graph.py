from __future__ import annotations

from .llm import ChatLLM, get_default_llm
from .nodes import (
    classify_question_node,
    forbidden_filter_node,
    forbidden_response_node,
    generate_response_node,
    load_context_node,
    prompt_composition_node,
    rag_search_node,
    route_after_classification,
    save_conversation_node,
)
from .repositories import ChatbotRepository
from .state import ChatState


def build_chat_graph(
    *,
    llm: ChatLLM | None = None,
    repository: ChatbotRepository | None = None,
):
    try:
        from langgraph.graph import END, START, StateGraph
    except ImportError as exc:
        raise RuntimeError("langgraph is required for the BookLens chatbot.") from exc

    llm = llm or get_default_llm()
    repository = repository or ChatbotRepository()

    graph = StateGraph(ChatState)
    graph.add_node("load_context", lambda state: load_context_node(state, repository=repository))
    graph.add_node("classify_question", lambda state: classify_question_node(state, llm=llm))
    graph.add_node("forbidden_response", forbidden_response_node)
    graph.add_node("rag_search", lambda state: rag_search_node(state, repository=repository))
    graph.add_node("prompt_composition", prompt_composition_node)
    graph.add_node("generate_response", lambda state: generate_response_node(state, llm=llm))
    graph.add_node("forbidden_filter", forbidden_filter_node)
    graph.add_node("save_conversation", lambda state: save_conversation_node(state, repository=repository))

    graph.add_edge(START, "classify_question")
    graph.add_edge("classify_question", "load_context")
    graph.add_conditional_edges(
        "load_context",
        route_after_classification,
        {
            "forbidden_response": "forbidden_response",
            "rag_search": "rag_search",
            "prompt_composition": "prompt_composition",
        },
    )
    graph.add_edge("forbidden_response", "save_conversation")
    graph.add_edge("rag_search", "prompt_composition")
    graph.add_edge("prompt_composition", "generate_response")
    graph.add_edge("generate_response", "forbidden_filter")
    graph.add_edge("forbidden_filter", "save_conversation")
    graph.add_edge("save_conversation", END)

    return graph.compile()


def run_chat_pipeline(initial_state: ChatState) -> ChatState:
    app = build_chat_graph()
    return app.invoke(initial_state)
