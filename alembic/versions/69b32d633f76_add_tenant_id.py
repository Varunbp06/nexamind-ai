"""add tenant id

Revision ID: 69b32d633f76
Revises: 85ddcf286b9c
Create Date: 2025-12-09 21:51:32.810287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from db.op.safe_add import safe_add_column
from common.system_constants import DEFAULT_TENANT_ID


# revision identifiers, used by Alembic.
revision: str = '69b32d633f76'
down_revision: Union[str, Sequence[str], None] = '85ddcf286b9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    safe_add_column("pai_chatbot_model", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_chatdb_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_code_sandbox_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_dataset", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_dataset_sample", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_embedding_model", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_evaluator_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_experiment", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_guardrail_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_knowledgebase", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_knowledgebase_chunk", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_knowledgebase_file", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_knowledgebase_file_task", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_knowledgebase_metadata", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_llm_model", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_mcp_server", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_message", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_permissions", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_prompt_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_reranker_model", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_roles", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_run_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_thread", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_trace_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_user_roles", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_vectordb_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_websearch_config", sa.Column('tenant_id', sa.String(255), nullable=True))
    safe_add_column("pai_file_metadata", sa.Column('tenant_id', sa.String(255), nullable=True))

    safe_add_column("pai_experiment_sample_entity", sa.Column('tenant_id', sa.String(255), nullable=True))


    op.execute(sa.text(f"UPDATE pai_chatbot_model SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_chatdb_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_code_sandbox_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_dataset SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_dataset_sample SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_embedding_model SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_evaluator_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_experiment SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_guardrail_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_knowledgebase SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_knowledgebase_chunk SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_knowledgebase_file SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_knowledgebase_file_task SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_knowledgebase_metadata SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_llm_model SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_mcp_server SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_message SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_permissions SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_prompt_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_reranker_model SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_roles SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_run_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_thread SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_trace_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_user_roles SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_vectordb_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_websearch_config SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_file_metadata SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))
    op.execute(sa.text(f"UPDATE pai_experiment_sample_entity SET tenant_id = '{DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL"))

    if op.get_context().dialect.name == 'sqlite':
        with op.batch_alter_table('pai_knowledgebase_metadata') as batch_op:
            batch_op.drop_constraint(op.f('unique_kb_metadata'), type_='unique')
            batch_op.create_unique_constraint('unique_kb_metadata', ['name', 'kb_id'])
    elif op.get_context().dialect.name == 'postgresql':
        def _drop_if_exists(table: str, name: str) -> None:
            """Drop a unique/index constraint only when it actually exists.

            Fresh Postgres databases created from earlier migrations may not
            carry the server-auto-named ``<table>_<col>_key`` variants this
            revision historically targeted.
            """
            bind = op.get_bind()
            insp = sa.inspect(bind)
            names = {c["name"] for c in insp.get_unique_constraints(table)}
            try:
                idx = {i["name"] for i in insp.get_indexes(table)}
                names |= idx
            except Exception:
                pass
            if name in names:
                op.drop_constraint(name, table, type_='unique')
            else:
                print(f"[69b32d633f76] skip missing constraint {name} on {table}")

        def _create_unique_if_missing(table: str, name: str, cols) -> None:
            bind = op.get_bind()
            insp = sa.inspect(bind)
            names = {c["name"] for c in insp.get_unique_constraints(table)}
            if name in names:
                print(f"[69b32d633f76] constraint {name} already on {table}; skipping create")
                return
            op.create_unique_constraint(name, table, cols)

        _drop_if_exists('pai_knowledgebase_metadata', op.f('unique_kb_metadata'))
        _create_unique_if_missing('pai_knowledgebase_metadata', 'unique_kb_metadata', ['name', 'kb_id'])
        _drop_if_exists('pai_knowledgebase', 'pai_knowledgebase_name_key')
        _drop_if_exists('pai_embedding_model', 'pai_embedding_model_model_id_key')
        _drop_if_exists('pai_llm_model', 'pai_llm_model_model_id_key')
        _drop_if_exists('pai_reranker_model', 'pai_reranker_model_model_id_key')
        _drop_if_exists('pai_roles', 'pai_roles_name_key')
        _create_unique_if_missing('pai_embedding_model', 'unique_embedding_model', ['tenant_id', 'model_id'])
        _drop_if_exists('pai_file_metadata', op.f('unique_kb_file_metadata'))
        _create_unique_if_missing('pai_file_metadata', 'unique_kb_file_metadata', ['id', 'kb_id', 'file_id', 'tenant_id'])
        _create_unique_if_missing('pai_knowledgebase', 'unique_kb_name', ['tenant_id', 'name'])

        _drop_if_exists('pai_knowledgebase_file', op.f('unique_kb_file'))
        _create_unique_if_missing('pai_knowledgebase_file', 'unique_kb_file', ['kb_id', 'message_id', 'file_name', 'tenant_id'])

        _drop_if_exists('pai_knowledgebase_file_task', op.f('unique_kb_file_task'))
        _create_unique_if_missing('pai_knowledgebase_file_task', 'unique_kb_file_task', ['kb_id', 'file_id', 'file_part', 'tenant_id'])

        _create_unique_if_missing('pai_llm_model', 'unique_llm_model', ['tenant_id', 'model_id'])

        _drop_if_exists('pai_permissions', op.f('unique_role_permission'))
        _create_unique_if_missing('pai_permissions', 'unique_role_permission', ['name', 'role_id', 'tenant_id'])
        _create_unique_if_missing('pai_reranker_model', 'unique_reranker_model', ['tenant_id', 'model_id'])
        _drop_if_exists('pai_user_roles', op.f('unique_user_role'))
        _create_unique_if_missing('pai_user_roles', 'unique_user_role', ['user_id', 'role_id', 'tenant_id'])

    # ### end Alembic commands ###

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("pai_chatbot_model", "tenant_id")
    op.drop_column("pai_chatdb_config", "tenant_id")
    op.drop_column("pai_code_sandbox_config", "tenant_id")
    op.drop_column("pai_dataset", "tenant_id")
    op.drop_column("pai_dataset_sample", "tenant_id")
    op.drop_column("pai_embedding_model", "tenant_id")
    op.drop_column("pai_evaluator_config", "tenant_id")
    op.drop_column("pai_experiment", "tenant_id")
    op.drop_column("pai_guardrail_config", "tenant_id")
    op.drop_column("pai_knowledgebase", "tenant_id")
    op.drop_column("pai_knowledgebase_chunk", "tenant_id")
    op.drop_column("pai_knowledgebase_file", "tenant_id")
    op.drop_column("pai_knowledgebase_file_task", "tenant_id")  
    op.drop_column("pai_knowledgebase_metadata", "tenant_id")
    op.drop_column("pai_llm_model", "tenant_id")
    op.drop_column("pai_mcp_server", "tenant_id")
    op.drop_column("pai_message", "tenant_id")
    op.drop_column("pai_permissions", "tenant_id")
    op.drop_column("pai_prompt_config", "tenant_id")
    op.drop_column("pai_reranker_model", "tenant_id")
    op.drop_column("pai_roles", "tenant_id")
    op.drop_column("pai_run_config", "tenant_id")
    op.drop_column("pai_thread", "tenant_id")
    op.drop_column("pai_trace_config", "tenant_id")
    op.drop_column("pai_user_roles", "tenant_id")
    op.drop_column("pai_vectordb_config", "tenant_id")
    op.drop_column("pai_websearch_config", "tenant_id")