<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5 text-weight-bold q-mb-md">Utilizadores sem pagamento</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Lista de utilizadores registados que ainda não têm nenhum pagamento associado. Use os filtros por data para limitar ao período de registo.
        </p>

        <div v-if="viewMode === 'leads'" class="row items-end q-gutter-md wrap">
          <q-input
            v-model="dateFrom"
            label="Data inicial (registo)"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :max="dateTo || undefined"
          />
          <q-input
            v-model="dateTo"
            label="Data final (registo)"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :min="dateFrom || undefined"
          />
          <q-btn
            color="primary"
            icon="search"
            label="Filtrar"
            :loading="loading"
            @click="loadUsers"
          />
          <q-btn flat label="Limpar datas" @click="clearDates" />
        </div>

        <div v-else class="row items-end q-gutter-md wrap">
          <q-input
            v-model="filtroAtendDateFrom"
            label="Data inicial (contacto)"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :max="filtroAtendDateTo || undefined"
          />
          <q-input
            v-model="filtroAtendDateTo"
            label="Data final (contacto)"
            type="date"
            outlined
            dense
            clearable
            style="min-width: 180px"
            :min="filtroAtendDateFrom || undefined"
          />
          <q-select
            v-model="filtroAtendFeedback"
            :options="feedbackOptions"
            label="Feedback"
            outlined
            dense
            clearable
            emit-value
            map-options
            style="min-width: 180px"
          />
          <q-select
            v-model="filtroAtendPersona"
            :options="personaOptions"
            label="Persona"
            outlined
            dense
            clearable
            emit-value
            map-options
            style="min-width: 200px"
          />
          <q-input
            v-model="filtroAtendTelefone"
            label="Telefone"
            outlined
            dense
            clearable
            style="min-width: 140px"
          />
          <q-checkbox v-model="filtroAtendOnlyMine" label="Só os meus" dense />
          <q-btn
            color="primary"
            icon="search"
            label="Filtrar"
            :loading="loadingAtendimentos"
            @click="loadAtendimentos"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">
          <template v-if="viewMode === 'leads'">
            Resultados ({{ rows.length }} utilizadores)
          </template>
          <template v-else>
            Registos de atendimento ({{ atendimentosRows.length }})
          </template>
        </div>
        <q-space />
        <template v-if="viewMode === 'leads'">
          <q-btn
            color="primary"
            icon="support_agent"
            label="Registar atendimento"
            no-caps
            unelevated
            @click="openRegistarAtendimento"
          />
          <q-btn
            outline
            color="primary"
            icon="list_alt"
            label="Ver registos de atendimento"
            no-caps
            @click="showRegistos"
          />
          <q-btn flat round dense icon="refresh" :loading="loading" @click="loadUsers">
            <q-tooltip>Atualizar lista</q-tooltip>
          </q-btn>
        </template>
        <template v-else>
          <q-btn
            outline
            color="primary"
            icon="arrow_back"
            label="Voltar à lista"
            no-caps
            @click="viewMode = 'leads'"
          />
          <q-btn flat round dense icon="refresh" :loading="loadingAtendimentos" @click="loadAtendimentos">
            <q-tooltip>Atualizar registos</q-tooltip>
          </q-btn>
        </template>
      </q-card-section>
      <q-separator />

      <q-card-section v-if="viewMode === 'leads'" class="q-pa-none">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          v-model:pagination="pagination"
          flat
          bordered
          :rows-per-page-options="[10, 25, 50]"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name }}</div>
              <div v-if="props.row.username" class="text-caption text-grey-7">{{ props.row.username }}</div>
            </q-td>
          </template>
          <template v-slot:body-cell-data_registo="props">
            <q-td :props="props">{{ formatDate(props.row.date_joined) }}</q-td>
          </template>
          <template v-slot:body-cell-ligacoes="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-xs">
                <template v-for="call in (props.row.follow_up_calls || [])" :key="call.id">
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="sm"
                    color="primary"
                    class="chip-date-btn"
                    :label="formatDate(call.called_at)"
                  >
                    <q-menu anchor="bottom start" self="top start">
                      <q-card class="q-pa-sm" flat bordered>
                        <div class="text-caption text-grey-7">Data da ligação</div>
                        <div class="text-body2">{{ formatDate(call.called_at) }}</div>
                        <div class="text-caption text-grey-7 q-mt-xs">Registado por</div>
                        <div class="text-body2 text-weight-medium">{{ call.staff_name || '—' }}</div>
                      </q-card>
                    </q-menu>
                  </q-btn>
                </template>
                <q-btn
                  v-if="!(props.row.follow_up_calls && props.row.follow_up_calls.length)"
                  flat
                  dense
                  size="sm"
                  icon="add_circle"
                  color="primary"
                  label="Registar ligação"
                  @click="openRegistarLigacao(props.row)"
                />
                <span v-else class="text-caption text-grey-7">Já registada</span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                color="primary"
                icon="person"
                size="sm"
                label="Ver em Usuários"
                @click="goToUser(props.row.id)"
              />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="info" size="2rem" class="q-mr-sm" />
              Nenhum utilizador sem pagamento no período selecionado. Ajuste as datas ou remova os filtros.
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-section v-else class="q-pa-none">
        <q-table
          :rows="atendimentosRows"
          :columns="atendimentosColumns"
          row-key="id"
          :loading="loadingAtendimentos"
          flat
          bordered
          :pagination="{ rowsPerPage: 25 }"
          class="sticky-header-table"
        >
          <template v-slot:body-cell-contactado_em="props">
            <q-td :props="props">{{ formatDateTime(props.row.contactado_em) }}</q-td>
          </template>
          <template v-slot:body-cell-feedback="props">
            <q-td :props="props">
              <q-chip dense color="blue-grey-2" text-color="dark">{{ props.row.feedback_label }}</q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-persona="props">
            <q-td :props="props">
              <div>{{ props.row.persona_label }}</div>
              <div v-if="props.row.persona_subtipo_label" class="text-caption text-grey-7">
                {{ props.row.persona_subtipo_label }}
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-plataforma="props">
            <q-td :props="props">
              <q-chip v-if="props.row.usa_android" dense size="sm" color="green-2" class="q-mr-xs">Android</q-chip>
              <q-chip v-if="props.row.usa_iphone" dense size="sm" color="grey-3">iPhone</q-chip>
              <span v-if="!props.row.usa_android && !props.row.usa_iphone" class="text-grey-6">—</span>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat dense icon="visibility" color="primary" size="sm" @click="openDetalheAtendimento(props.row)">
                <q-tooltip>Ver detalhe</q-tooltip>
              </q-btn>
              <q-btn flat dense icon="edit" color="secondary" size="sm" @click="openEditarAtendimento(props.row)">
                <q-tooltip>Editar registo</q-tooltip>
              </q-btn>
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-pa-lg">
              <q-icon name="info" size="2rem" class="q-mr-sm" />
              Nenhum atendimento encontrado. Ajuste os filtros ou registe o primeiro atendimento.
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialog: registar ligação (existente) -->
    <q-dialog v-model="dialogRegistarLigacao" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Registar ligação</div>
          <p class="text-caption text-grey-7">
            Marque que ligou a {{ targetUserForCall?.name || 'este utilizador' }} na data abaixo.
          </p>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="novaLigacaoData"
            label="Data da ligação"
            type="date"
            outlined
            dense
            class="full-width"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn unelevated label="Guardar" color="primary" :loading="savingCall" @click="guardarLigacao" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: registar atendimento -->
    <q-dialog v-model="dialogRegistarAtendimento" persistent>
      <q-card class="atendimento-dialog-card">
        <q-card-section class="atendimento-dialog-header row items-center no-wrap">
          <q-icon name="support_agent" size="md" class="q-mr-sm" />
          <div class="col">
            <div class="text-h6 text-weight-bold">Registar atendimento</div>
            <div class="text-caption text-white" style="opacity: 0.9">
              Preencha os dados da conversa com o utilizador sem pagamento
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="closeRegistarAtendimento" />
        </q-card-section>

        <q-card-section class="atendimento-dialog-body q-pa-none">
          <q-scroll-area class="atendimento-scroll-area">
            <div class="q-pa-lg q-gutter-lg">
              <!-- Secção 1: Utilizador -->
              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="person_search" size="sm" class="q-mr-xs" />
                  Utilizador
                </div>
                <q-select
                  v-model="formAtendimento.userId"
                  :options="userSearchOptions"
                  label="Pesquisar por telefone ou nome *"
                  outlined
                  dense
                  use-input
                  input-debounce="300"
                  emit-value
                  map-options
                  :loading="userSearchLoading"
                  class="bg-white"
                  @filter="filterUsersForAtendimento"
                  @update:model-value="onAtendimentoUserSelected"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">Digite para pesquisar</q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <q-card v-if="selectedAtendimentoUser" flat bordered class="user-preview-card q-mt-md">
                  <q-card-section class="row items-center q-py-sm">
                    <q-avatar color="primary" text-color="white" icon="person" class="q-mr-md" />
                    <div class="col">
                      <div class="text-weight-bold">{{ selectedAtendimentoUser.name }}</div>
                      <div class="text-caption text-grey-7">
                        Cadastro: {{ selectedAtendimentoUser.telefone || '—' }}
                        · Registo: {{ formatDate(selectedAtendimentoUser.date_joined) }}
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Secção 2: Data do contacto -->
              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="event" size="sm" class="q-mr-xs" />
                  Data do contacto
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formAtendimento.contactado_em"
                      label="Data *"
                      type="date"
                      outlined
                      dense
                      class="bg-white"
                    >
                      <template v-slot:prepend>
                        <q-icon name="calendar_today" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formAtendimento.contactado_hora"
                      label="Hora (opcional)"
                      type="time"
                      outlined
                      dense
                      class="bg-white"
                    >
                      <template v-slot:prepend>
                        <q-icon name="schedule" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>

              <!-- Secção 3: Feedback -->
              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="forum" size="sm" class="q-mr-xs" />
                  Feedback *
                </div>
                <div class="feedback-grid">
                  <q-btn
                    v-for="opt in feedbackOptions"
                    :key="opt.value"
                    :outline="formAtendimento.feedback !== opt.value"
                    :unelevated="formAtendimento.feedback === opt.value"
                    :color="formAtendimento.feedback === opt.value ? 'primary' : 'grey-7'"
                    :text-color="formAtendimento.feedback === opt.value ? 'white' : undefined"
                    no-caps
                    class="feedback-chip"
                    @click="formAtendimento.feedback = opt.value"
                  >
                    {{ opt.label }}
                  </q-btn>
                </div>
              </div>

              <!-- Secção 4: Persona -->
              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="psychology" size="sm" class="q-mr-xs" />
                  Persona *
                </div>
                <q-select
                  v-model="formAtendimento.persona"
                  :options="personaOptions"
                  label="Tipo de utilizador"
                  outlined
                  dense
                  emit-value
                  map-options
                  class="bg-white"
                >
                  <template v-slot:prepend>
                    <q-icon name="category" />
                  </template>
                </q-select>

                <div
                  v-if="formAtendimento.persona === 'prep_exame_inatro'"
                  class="subtipo-box q-mt-md"
                >
                  <div class="text-caption text-weight-medium text-grey-8 q-mb-sm">Exame INATRO</div>
                  <q-btn-toggle
                    v-model="formAtendimento.persona_subtipo"
                    spread
                    no-caps
                    toggle-color="primary"
                    :options="personaSubtipoInatroOptions"
                    class="full-width"
                  />
                </div>
                <div
                  v-else-if="formAtendimento.persona === 'iniciante'"
                  class="subtipo-box q-mt-md"
                >
                  <div class="text-caption text-weight-medium text-grey-8 q-mb-sm">Iniciante</div>
                  <q-btn-toggle
                    v-model="formAtendimento.persona_subtipo"
                    spread
                    no-caps
                    toggle-color="primary"
                    :options="personaSubtipoInicianteOptions"
                    class="full-width"
                  />
                </div>
              </div>

              <!-- Secção 5: Dispositivo e app -->
              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="smartphone" size="sm" class="q-mr-xs" />
                  Dispositivo e app
                </div>
                <div class="row q-col-gutter-md items-center">
                  <div class="col-12 col-sm-4">
                    <q-checkbox v-model="formAtendimento.usa_android" label="Android" dense />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-checkbox v-model="formAtendimento.usa_iphone" label="iPhone" dense />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-checkbox v-model="formAtendimento.nova_versao" label="Nova versão" dense />
                  </div>
                </div>
                <q-select
                  v-model="formAtendimento.mesmo_celular_app"
                  :options="mesmoCelularOptions"
                  label="Nº de pagamento no mesmo celular da app?"
                  outlined
                  dense
                  emit-value
                  map-options
                  clearable
                  class="bg-white q-mt-md"
                />
              </div>

              <!-- Secção 6: Pagamento e origem -->
              <div class="form-section">
                <div class="form-section-title row items-center">
                  <span class="col">
                    <q-icon name="payments" size="sm" class="q-mr-xs" />
                    Pagamento e origem
                  </span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="search"
                    label="Buscar pagamento"
                    :loading="pagamentoBuscaLoading"
                    :disable="!selectedAtendimentoUser?.telefone"
                    @click="buscarPagamentoParaAtendimento('create')"
                  />
                </div>

                <q-banner
                  v-if="pagamentoBuscaFeita && pagamentosEncontrados.length"
                  dense
                  rounded
                  class="bg-green-1 text-dark q-mb-md"
                >
                  <template v-slot:avatar>
                    <q-icon name="check_circle" color="positive" />
                  </template>
                  {{ pagamentosEncontrados.length }} pagamento(s) encontrado(s) no gateway (M-Pesa / E-Mola).
                  O número foi preenchido automaticamente.
                </q-banner>
                <q-banner
                  v-else-if="pagamentoBuscaFeita && !pagamentoBuscaLoading"
                  dense
                  rounded
                  class="bg-grey-2 text-dark q-mb-md"
                >
                  <template v-slot:avatar>
                    <q-icon name="info" color="grey-7" />
                  </template>
                  Nenhum pagamento encontrado para o telefone de cadastro. Pode preencher manualmente ou tentar outro número.
                </q-banner>

                <q-select
                  v-if="pagamentosEncontrados.length > 1"
                  v-model="pagamentoSelecionadoKey"
                  :options="pagamentosEncontradosOptions"
                  label="Seleccionar pagamento encontrado"
                  outlined
                  dense
                  emit-value
                  map-options
                  class="bg-white q-mb-md"
                  @update:model-value="onPagamentoSelecionadoChange('create')"
                />

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formAtendimento.numero_pagamento"
                      label="Número de pagamento"
                      outlined
                      dense
                      mask="###########"
                      unmasked-value
                      clearable
                      class="bg-white"
                      hint="Preenchido automaticamente se existir pagamento no gateway"
                    >
                      <template v-slot:prepend>
                        <q-icon name="phone" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formAtendimento.como_soube"
                      label="Como soube"
                      outlined
                      dense
                      clearable
                      class="bg-white"
                    >
                      <template v-slot:prepend>
                        <q-icon name="campaign" />
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>

              <!-- Secção 7: Observações -->
              <div class="form-section form-section-last">
                <div class="form-section-title">
                  <q-icon name="notes" size="sm" class="q-mr-xs" />
                  Observações
                </div>
                <q-input
                  v-model="formAtendimento.observacoes"
                  placeholder="Notas adicionais sobre a conversa..."
                  type="textarea"
                  outlined
                  dense
                  autogrow
                  class="bg-white"
                  :input-style="{ minHeight: '72px' }"
                />
              </div>
            </div>
          </q-scroll-area>
        </q-card-section>

        <q-separator />
        <q-card-actions class="atendimento-dialog-actions q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" no-caps @click="closeRegistarAtendimento" />
          <q-space />
          <q-btn
            unelevated
            label="Guardar atendimento"
            color="primary"
            icon="save"
            no-caps
            :loading="savingAtendimento"
            :disable="!formAtendimento.userId || !formAtendimento.feedback || !formAtendimento.persona"
            @click="guardarAtendimento"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: detalhe do atendimento -->
    <q-dialog v-model="dialogDetalheAtendimento">
      <q-card v-if="atendimentoDetalhe" style="min-width: 400px; max-width: 92vw">
        <q-card-section>
          <div class="text-h6">Detalhe do atendimento</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <div><span class="text-grey-7">Data:</span> {{ formatDateTime(atendimentoDetalhe.contactado_em) }}</div>
          <div><span class="text-grey-7">Utilizador:</span> {{ atendimentoDetalhe.target_user_name }}</div>
          <div><span class="text-grey-7">Nº cadastro:</span> {{ atendimentoDetalhe.target_user_telefone || '—' }}</div>
          <div><span class="text-grey-7">Registado por:</span> {{ atendimentoDetalhe.staff_name }}</div>
          <div><span class="text-grey-7">Feedback:</span> {{ atendimentoDetalhe.feedback_label }}</div>
          <div><span class="text-grey-7">Persona:</span> {{ atendimentoDetalhe.persona_label }}</div>
          <div v-if="atendimentoDetalhe.persona_subtipo_label">
            <span class="text-grey-7">Sub-tipo:</span> {{ atendimentoDetalhe.persona_subtipo_label }}
          </div>
          <div><span class="text-grey-7">Nº pagamento:</span> {{ atendimentoDetalhe.numero_pagamento || '—' }}</div>
          <div><span class="text-grey-7">Nova versão:</span> {{ atendimentoDetalhe.nova_versao ? 'Sim' : 'Não' }}</div>
          <div>
            <span class="text-grey-7">Plataforma:</span>
            {{ [atendimentoDetalhe.usa_android && 'Android', atendimentoDetalhe.usa_iphone && 'iPhone'].filter(Boolean).join(', ') || '—' }}
          </div>
          <div><span class="text-grey-7">Mesmo celular:</span> {{ atendimentoDetalhe.mesmo_celular_app_label || '—' }}</div>
          <div><span class="text-grey-7">Como soube:</span> {{ atendimentoDetalhe.como_soube || '—' }}</div>
          <div v-if="atendimentoDetalhe.observacoes">
            <span class="text-grey-7">Observações:</span> {{ atendimentoDetalhe.observacoes }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Fechar" color="grey" v-close-popup />
          <q-btn
            unelevated
            label="Editar registo"
            color="primary"
            icon="edit"
            no-caps
            @click="openEditarAtendimentoFromDetalhe"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: editar atendimento -->
    <q-dialog v-model="dialogEditarAtendimento" persistent>
      <q-card class="atendimento-dialog-card">
        <q-card-section class="atendimento-dialog-header row items-center no-wrap">
          <q-icon name="edit_note" size="md" class="q-mr-sm" />
          <div class="col">
            <div class="text-h6 text-weight-bold">Editar atendimento</div>
            <div class="text-caption text-white" style="opacity: 0.9">
              Actualize quando o cliente ligar (ex.: nº de pagamento e origem)
            </div>
          </div>
          <q-btn flat round dense icon="close" color="white" @click="closeEditarAtendimento" />
        </q-card-section>

        <q-card-section class="atendimento-dialog-body q-pa-none">
          <q-scroll-area class="atendimento-scroll-area">
            <div class="q-pa-lg q-gutter-lg">
              <q-banner dense rounded class="bg-amber-1 text-dark">
                <template v-slot:avatar>
                  <q-icon name="info" color="amber-9" />
                </template>
                Use esta edição quando o utilizador disse que ia ligar noutra hora — registe aqui o
                <strong>número de pagamento</strong>, a <strong>origem (como soube)</strong> e actualize o feedback se necessário.
              </q-banner>

              <q-card v-if="editAtendimentoMeta" flat bordered class="user-preview-card">
                <q-card-section class="row items-center q-py-sm">
                  <q-avatar color="primary" text-color="white" icon="person" class="q-mr-md" />
                  <div class="col">
                    <div class="text-weight-bold">{{ editAtendimentoMeta.target_user_name }}</div>
                    <div class="text-caption text-grey-7">
                      Cadastro: {{ editAtendimentoMeta.target_user_telefone || '—' }}
                      · Registado por: {{ editAtendimentoMeta.staff_name }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="event" size="sm" class="q-mr-xs" />
                  Data do contacto
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input v-model="formEditAtendimento.contactado_em" label="Data *" type="date" outlined dense class="bg-white" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="formEditAtendimento.contactado_hora" label="Hora (opcional)" type="time" outlined dense class="bg-white" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="forum" size="sm" class="q-mr-xs" />
                  Feedback *
                </div>
                <div class="feedback-grid">
                  <q-btn
                    v-for="opt in feedbackOptions"
                    :key="'edit-' + opt.value"
                    :outline="formEditAtendimento.feedback !== opt.value"
                    :unelevated="formEditAtendimento.feedback === opt.value"
                    :color="formEditAtendimento.feedback === opt.value ? 'primary' : 'grey-7'"
                    :text-color="formEditAtendimento.feedback === opt.value ? 'white' : undefined"
                    no-caps
                    class="feedback-chip"
                    @click="formEditAtendimento.feedback = opt.value"
                  >
                    {{ opt.label }}
                  </q-btn>
                </div>
              </div>

              <div class="form-section form-section-highlight">
                <div class="form-section-title row items-center">
                  <span class="col">
                    <q-icon name="payments" size="sm" class="q-mr-xs" />
                    Pagamento e origem
                  </span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="search"
                    label="Buscar pagamento"
                    :loading="pagamentoBuscaEditLoading"
                    :disable="!editAtendimentoMeta?.target_user_telefone"
                    @click="buscarPagamentoParaAtendimento('edit')"
                  />
                </div>

                <q-banner
                  v-if="pagamentoBuscaEditFeita && pagamentosEncontradosEdit.length"
                  dense
                  rounded
                  class="bg-green-1 text-dark q-mb-md"
                >
                  <template v-slot:avatar>
                    <q-icon name="check_circle" color="positive" />
                  </template>
                  Pagamento encontrado no gateway — número actualizado.
                </q-banner>

                <q-select
                  v-if="pagamentosEncontradosEdit.length > 1"
                  v-model="pagamentoSelecionadoEditKey"
                  :options="pagamentosEncontradosEditOptions"
                  label="Seleccionar pagamento"
                  outlined
                  dense
                  emit-value
                  map-options
                  class="bg-white q-mb-md"
                  @update:model-value="onPagamentoSelecionadoChange('edit')"
                />

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formEditAtendimento.numero_pagamento"
                      label="Número de pagamento"
                      outlined
                      dense
                      mask="###########"
                      unmasked-value
                      clearable
                      class="bg-white"
                    >
                      <template v-slot:prepend>
                        <q-icon name="phone" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="formEditAtendimento.como_soube"
                      label="Como soube (origem)"
                      outlined
                      dense
                      clearable
                      class="bg-white"
                    >
                      <template v-slot:prepend>
                        <q-icon name="campaign" />
                      </template>
                    </q-input>
                  </div>
                </div>
                <q-select
                  v-model="formEditAtendimento.mesmo_celular_app"
                  :options="mesmoCelularOptions"
                  label="Nº de pagamento no mesmo celular da app?"
                  outlined
                  dense
                  emit-value
                  map-options
                  clearable
                  class="bg-white q-mt-md"
                />
              </div>

              <div class="form-section">
                <div class="form-section-title">
                  <q-icon name="psychology" size="sm" class="q-mr-xs" />
                  Persona
                </div>
                <q-select
                  v-model="formEditAtendimento.persona"
                  :options="personaOptions"
                  label="Tipo de utilizador *"
                  outlined
                  dense
                  emit-value
                  map-options
                  class="bg-white"
                />
                <div v-if="formEditAtendimento.persona === 'prep_exame_inatro'" class="subtipo-box q-mt-md">
                  <q-btn-toggle
                    v-model="formEditAtendimento.persona_subtipo"
                    spread
                    no-caps
                    toggle-color="primary"
                    :options="personaSubtipoInatroOptions"
                    class="full-width"
                  />
                </div>
                <div v-else-if="formEditAtendimento.persona === 'iniciante'" class="subtipo-box q-mt-md">
                  <q-btn-toggle
                    v-model="formEditAtendimento.persona_subtipo"
                    spread
                    no-caps
                    toggle-color="primary"
                    :options="personaSubtipoInicianteOptions"
                    class="full-width"
                  />
                </div>
              </div>

              <div class="form-section form-section-last">
                <div class="form-section-title">
                  <q-icon name="notes" size="sm" class="q-mr-xs" />
                  Observações
                </div>
                <q-input
                  v-model="formEditAtendimento.observacoes"
                  type="textarea"
                  outlined
                  dense
                  autogrow
                  class="bg-white"
                  placeholder="Ex.: Cliente ligou às 15h conforme combinado..."
                />
              </div>
            </div>
          </q-scroll-area>
        </q-card-section>

        <q-separator />
        <q-card-actions class="atendimento-dialog-actions q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" no-caps @click="closeEditarAtendimento" />
          <q-space />
          <q-btn
            unelevated
            label="Guardar alterações"
            color="primary"
            icon="save"
            no-caps
            :loading="savingEditAtendimento"
            @click="guardarEdicaoAtendimento"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const columns = [
  { name: 'nome', label: 'Nome', field: 'name', align: 'left', sortable: true },
  { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'data_registo', label: 'Data de registo', field: 'date_joined', align: 'left', sortable: true },
  { name: 'ligacoes', label: 'Ligações', field: 'follow_up_calls', align: 'left' },
  { name: 'actions', label: 'Ações', align: 'center' },
]

const atendimentosColumns = [
  { name: 'contactado_em', label: 'Data contacto', field: 'contactado_em', align: 'left', sortable: true },
  { name: 'target_user_name', label: 'Nome', field: 'target_user_name', align: 'left', sortable: true },
  { name: 'target_user_telefone', label: 'Nº cadastro', field: 'target_user_telefone', align: 'left' },
  { name: 'feedback', label: 'Feedback', field: 'feedback_label', align: 'left' },
  { name: 'persona', label: 'Persona', field: 'persona_label', align: 'left' },
  { name: 'numero_pagamento', label: 'Nº pagamento', field: 'numero_pagamento', align: 'left' },
  { name: 'staff_name', label: 'Registado por', field: 'staff_name', align: 'left' },
  { name: 'plataforma', label: 'Plataforma', field: 'plataforma', align: 'left' },
  { name: 'actions', label: '', align: 'center' },
]

const feedbackOptions = [
  { label: 'Atendeu', value: 'atendeu' },
  { label: 'Não atendeu', value: 'nao_atendeu' },
  { label: 'Desligou', value: 'desligou' },
  { label: 'Cancelou', value: 'cancelou' },
  { label: 'Ocupado no momento', value: 'ocupado_momento' },
  { label: 'Vai retornar', value: 'vai_retornar' },
]

const personaOptions = [
  { label: 'Curioso (só queria informações)', value: 'curioso' },
  { label: 'Preparação para testes da escola de condução', value: 'prep_testes_escola' },
  { label: 'Preparação para exame do INATRO', value: 'prep_exame_inatro' },
  { label: 'Futuro usuário', value: 'futuro_usuario' },
  { label: 'Prestes a inscrever-se', value: 'prestes_inscrever' },
  { label: 'Iniciante', value: 'iniciante' },
]

const personaSubtipoInatroOptions = [
  { label: 'Com data marcada', value: 'com_data' },
  { label: 'Sem data marcada', value: 'sem_data' },
]

const personaSubtipoInicianteOptions = [
  { label: 'Com tempo', value: 'com_tempo' },
  { label: 'Sem tempo', value: 'sem_tempo' },
]

const mesmoCelularOptions = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
  { label: 'Não sabe / não perguntado', value: 'nao_sei' },
]

const AUTO_REFRESH_MS = 30000
const STORAGE_KEY = 'users-no-payments-state-v1'

function defaultFormAtendimento() {
  return {
    userId: null,
    contactado_em: new Date().toISOString().slice(0, 10),
    contactado_hora: '',
    feedback: '',
    persona: '',
    persona_subtipo: '',
    numero_pagamento: '',
    nova_versao: false,
    usa_android: false,
    usa_iphone: false,
    mesmo_celular_app: '',
    como_soube: '',
    observacoes: '',
  }
}

function userDisplayName(u) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || '—'
}

function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-9)
}

function paymentOptionKey(p, index) {
  return `${p.method || 'pay'}-${index}-${p.phone_number || ''}-${p.payment_date || ''}`
}

function formatPaymentLabel(p) {
  const method = String(p.method || '').toUpperCase()
  const amount = p.amount != null
    ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(p.amount)
    : '—'
  const dateRaw = p.payment_date
  let dateStr = '—'
  if (dateRaw) {
    const d = new Date(dateRaw)
    dateStr = Number.isNaN(d.getTime())
      ? String(dateRaw)
      : d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return `${method} · ${p.phone_number || '—'} · ${amount} · ${dateStr}`
}

function splitContactadoEm(iso) {
  if (!iso) return { date: '', hour: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const parts = String(iso).split('T')
    return { date: parts[0] || '', hour: (parts[1] || '').slice(0, 5) }
  }
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function formFromAtendimentoRow(row) {
  const { date, hour } = splitContactadoEm(row.contactado_em)
  return {
    contactado_em: date,
    contactado_hora: hour,
    feedback: row.feedback || '',
    persona: row.persona || '',
    persona_subtipo: row.persona_subtipo || '',
    numero_pagamento: row.numero_pagamento || '',
    nova_versao: !!row.nova_versao,
    usa_android: !!row.usa_android,
    usa_iphone: !!row.usa_iphone,
    mesmo_celular_app: row.mesmo_celular_app || '',
    como_soube: row.como_soube || '',
    observacoes: row.observacoes || '',
  }
}

export default {
  name: 'UsersNoPaymentsPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const loading = ref(false)
    const rows = ref([])
    const dateFrom = ref('')
    const dateTo = ref('')
    const pagination = ref({
      sortBy: 'data_registo',
      descending: true,
      page: 1,
      rowsPerPage: 10,
    })
    const dialogRegistarLigacao = ref(false)
    const targetUserForCall = ref(null)
    const savingCall = ref(false)
    const novaLigacaoData = ref('')

    const viewMode = ref('leads')
    const dialogRegistarAtendimento = ref(false)
    const savingAtendimento = ref(false)
    const formAtendimento = ref(defaultFormAtendimento())
    const userSearchOptions = ref([])
    const userSearchLoading = ref(false)
    const selectedAtendimentoUser = ref(null)

    const pagamentoBuscaLoading = ref(false)
    const pagamentoBuscaFeita = ref(false)
    const pagamentosEncontrados = ref([])
    const pagamentosEncontradosOptions = ref([])
    const pagamentoSelecionadoKey = ref(null)

    const pagamentoBuscaEditLoading = ref(false)
    const pagamentoBuscaEditFeita = ref(false)
    const pagamentosEncontradosEdit = ref([])
    const pagamentosEncontradosEditOptions = ref([])
    const pagamentoSelecionadoEditKey = ref(null)

    const loadingAtendimentos = ref(false)
    const atendimentosRows = ref([])
    const filtroAtendDateFrom = ref('')
    const filtroAtendDateTo = ref('')
    const filtroAtendFeedback = ref(null)
    const filtroAtendPersona = ref(null)
    const filtroAtendTelefone = ref('')
    const filtroAtendOnlyMine = ref(false)

    const dialogDetalheAtendimento = ref(false)
    const atendimentoDetalhe = ref(null)

    const dialogEditarAtendimento = ref(false)
    const editAtendimentoId = ref(null)
    const editAtendimentoMeta = ref(null)
    const formEditAtendimento = ref(formFromAtendimentoRow({}))
    const savingEditAtendimento = ref(false)

    let refreshTimer = null

    function formatDate(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    function formatDateTime(val) {
      if (!val) return '—'
      const d = new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    function saveState() {
      try {
        const payload = {
          dateFrom: dateFrom.value || '',
          dateTo: dateTo.value || '',
          pagination: pagination.value,
          scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {
        // ignore
      }
    }

    function restoreState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        dateFrom.value = parsed.dateFrom || ''
        dateTo.value = parsed.dateTo || ''
        if (parsed.pagination && typeof parsed.pagination === 'object') {
          pagination.value = { ...pagination.value, ...parsed.pagination }
        }
        if (typeof parsed.scrollY === 'number') {
          nextTick(() => {
            window.scrollTo({ top: parsed.scrollY, behavior: 'auto' })
          })
        }
      } catch {
        // ignore
      }
    }

    async function loadUsers(options = {}) {
      const { silent = false, preservePosition = false } = options
      const previousScrollY = preservePosition ? window.scrollY : 0
      if (!silent) loading.value = true
      try {
        const params = new URLSearchParams()
        params.set('no_payments', '1')
        if (dateFrom.value) params.set('date_from', dateFrom.value)
        if (dateTo.value) params.set('date_to', dateTo.value)
        const response = await api.get(`/users/list/?${params.toString()}`)
        const list = Array.isArray(response.data) ? response.data : []
        rows.value = list.map((u) => ({
          ...u,
          name: userDisplayName(u),
          follow_up_calls: u.follow_up_calls || [],
        }))
        if (preservePosition) {
          await nextTick()
          window.scrollTo({ top: previousScrollY, behavior: 'auto' })
        }
      } catch (err) {
        console.error('Erro ao carregar utilizadores sem pagamento:', err)
        if (!silent) rows.value = []
        const msg = err.response?.data?.detail || err.response?.data?.error || 'Erro ao carregar lista'
        if (!silent) $q.notify({ type: 'negative', message: msg })
      } finally {
        if (!silent) loading.value = false
      }
    }

    async function loadAtendimentos() {
      loadingAtendimentos.value = true
      try {
        const params = new URLSearchParams()
        if (filtroAtendDateFrom.value) params.set('date_from', filtroAtendDateFrom.value)
        if (filtroAtendDateTo.value) params.set('date_to', filtroAtendDateTo.value)
        if (filtroAtendFeedback.value) params.set('feedback', filtroAtendFeedback.value)
        if (filtroAtendPersona.value) params.set('persona', filtroAtendPersona.value)
        if (filtroAtendTelefone.value) params.set('telefone', filtroAtendTelefone.value.trim())
        if (filtroAtendOnlyMine.value) params.set('only_mine', '1')
        const response = await api.get(`/atendimentos/?${params.toString()}`)
        atendimentosRows.value = Array.isArray(response.data) ? response.data : []
      } catch (err) {
        console.error('Erro ao carregar atendimentos:', err)
        atendimentosRows.value = []
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao carregar registos',
        })
      } finally {
        loadingAtendimentos.value = false
      }
    }

    function clearDates() {
      dateFrom.value = ''
      dateTo.value = ''
      loadUsers()
    }

    function goToUser(userId) {
      router.push({ path: '/users', query: { user_id: userId } })
    }

    function openRegistarLigacao(row) {
      targetUserForCall.value = row
      novaLigacaoData.value = new Date().toISOString().slice(0, 10)
      dialogRegistarLigacao.value = true
    }

    async function guardarLigacao() {
      const target = targetUserForCall.value
      if (!target?.id || !novaLigacaoData.value) {
        $q.notify({ type: 'warning', message: 'Seleccione a data da ligação.' })
        return
      }
      savingCall.value = true
      try {
        await api.post(`/users/${target.id}/follow-up-calls/`, {
          called_at: novaLigacaoData.value,
        })
        $q.notify({ type: 'positive', message: 'Ligação registada.' })
        dialogRegistarLigacao.value = false
        targetUserForCall.value = null
        await loadUsers()
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || err.response?.data?.detail || 'Erro ao guardar ligação',
        })
      } finally {
        savingCall.value = false
      }
    }

    function mapUserToOption(u) {
      const name = userDisplayName(u)
      const tel = u.telefone || '—'
      return {
        label: `${tel} — ${name}`,
        value: u.id,
        user: {
          id: u.id,
          name,
          telefone: u.telefone,
          date_joined: u.date_joined,
        },
      }
    }

    function resetPagamentoBuscaCreate() {
      pagamentoBuscaLoading.value = false
      pagamentoBuscaFeita.value = false
      pagamentosEncontrados.value = []
      pagamentosEncontradosOptions.value = []
      pagamentoSelecionadoKey.value = null
    }

    function resetPagamentoBuscaEdit() {
      pagamentoBuscaEditLoading.value = false
      pagamentoBuscaEditFeita.value = false
      pagamentosEncontradosEdit.value = []
      pagamentosEncontradosEditOptions.value = []
      pagamentoSelecionadoEditKey.value = null
    }

    function applyPagamentoAoFormulario(payment, form, cadastroTelefone) {
      if (!payment) return
      const payPhone = String(payment.phone_number || '').replace(/\D/g, '')
      form.numero_pagamento = payPhone
      const payNorm = normalizePhoneDigits(payment.phone_number)
      const cadNorm = normalizePhoneDigits(cadastroTelefone)
      if (payNorm && cadNorm) {
        form.mesmo_celular_app = payNorm === cadNorm ? 'sim' : 'nao'
      }
    }

    function setPagamentosResultado(payments, mode) {
      const list = Array.isArray(payments) ? payments : []
      const options = list.map((p, index) => ({
        label: formatPaymentLabel(p),
        value: paymentOptionKey(p, index),
        payment: p,
      }))

      if (mode === 'edit') {
        pagamentosEncontradosEdit.value = list
        pagamentosEncontradosEditOptions.value = options
        pagamentoBuscaEditFeita.value = true
        if (options.length) {
          pagamentoSelecionadoEditKey.value = options[0].value
          applyPagamentoAoFormulario(
            options[0].payment,
            formEditAtendimento.value,
            editAtendimentoMeta.value?.target_user_telefone
          )
        }
        return
      }

      pagamentosEncontrados.value = list
      pagamentosEncontradosOptions.value = options
      pagamentoBuscaFeita.value = true
      if (options.length) {
        pagamentoSelecionadoKey.value = options[0].value
        applyPagamentoAoFormulario(
          options[0].payment,
          formAtendimento.value,
          selectedAtendimentoUser.value?.telefone
        )
      }
    }

    function onPagamentoSelecionadoChange(mode) {
      if (mode === 'edit') {
        const opt = pagamentosEncontradosEditOptions.value.find((o) => o.value === pagamentoSelecionadoEditKey.value)
        applyPagamentoAoFormulario(
          opt?.payment,
          formEditAtendimento.value,
          editAtendimentoMeta.value?.target_user_telefone
        )
        return
      }
      const opt = pagamentosEncontradosOptions.value.find((o) => o.value === pagamentoSelecionadoKey.value)
      applyPagamentoAoFormulario(
        opt?.payment,
        formAtendimento.value,
        selectedAtendimentoUser.value?.telefone
      )
    }

    async function buscarPagamentoParaAtendimento(mode = 'create') {
      const telefone =
        mode === 'edit'
          ? editAtendimentoMeta.value?.target_user_telefone
          : selectedAtendimentoUser.value?.telefone

      if (!telefone) {
        $q.notify({ type: 'warning', message: 'Seleccione um utilizador com telefone de cadastro.' })
        return
      }

      if (mode === 'edit') {
        pagamentoBuscaEditLoading.value = true
      } else {
        pagamentoBuscaLoading.value = true
      }

      try {
        const { data } = await api.get('/payments/admin/external-with-claims/', {
          params: { phone: telefone },
        })
        const payments = data?.payments || []
        setPagamentosResultado(payments, mode)

        if (!payments.length) {
          $q.notify({
            type: 'info',
            message: 'Nenhum pagamento encontrado no gateway para este número.',
          })
        } else {
          $q.notify({
            type: 'positive',
            message: `Pagamento encontrado — nº ${payments[0].phone_number || telefone} preenchido.`,
          })
        }
      } catch (err) {
        console.error('Erro ao buscar pagamento:', err)
        if (mode === 'edit') {
          pagamentoBuscaEditFeita.value = true
          pagamentosEncontradosEdit.value = []
        } else {
          pagamentoBuscaFeita.value = true
          pagamentosEncontrados.value = []
        }
        $q.notify({
          type: 'negative',
          message: parseApiError(err, 'Erro ao buscar pagamento no gateway'),
        })
      } finally {
        if (mode === 'edit') {
          pagamentoBuscaEditLoading.value = false
        } else {
          pagamentoBuscaLoading.value = false
        }
      }
    }

    function openRegistarAtendimento() {
      formAtendimento.value = defaultFormAtendimento()
      selectedAtendimentoUser.value = null
      resetPagamentoBuscaCreate()
      userSearchOptions.value = rows.value.slice(0, 20).map(mapUserToOption)
      dialogRegistarAtendimento.value = true
    }

    function closeRegistarAtendimento() {
      dialogRegistarAtendimento.value = false
      formAtendimento.value = defaultFormAtendimento()
      selectedAtendimentoUser.value = null
      resetPagamentoBuscaCreate()
    }

    function onAtendimentoUserSelected(userId) {
      const opt = userSearchOptions.value.find((o) => o.value === userId)
      selectedAtendimentoUser.value = opt?.user || null
      resetPagamentoBuscaCreate()
      if (selectedAtendimentoUser.value?.telefone) {
        buscarPagamentoParaAtendimento('create')
      }
    }

    async function filterUsersForAtendimento(val, update) {
      const term = (val || '').trim()
      if (!term) {
        update(() => {
          userSearchOptions.value = rows.value.slice(0, 20).map(mapUserToOption)
        })
        return
      }
      userSearchLoading.value = true
      try {
        const isPhone = term.replace(/\s/g, '').match(/^\+?\d+$/)
        const param = isPhone ? `telefone=${encodeURIComponent(term)}` : `q=${encodeURIComponent(term)}`
        const { data } = await api.get(`/users/filter/?${param}`)
        const list = Array.isArray(data) ? data : []
        update(() => {
          userSearchOptions.value = list.map(mapUserToOption)
        })
      } catch {
        update(() => {
          userSearchOptions.value = []
        })
      } finally {
        userSearchLoading.value = false
      }
    }

    function buildContactadoEmFromForm(form) {
      const d = form.contactado_em
      const h = form.contactado_hora
      if (!d) return null
      if (h) return `${d}T${h}:00`
      return d
    }

    function parseApiError(err, fallback) {
      const data = err?.response?.data
      if (typeof data === 'string' && data.trim()) return data
      if (data?.error) return data.error
      if (data?.detail) return data.detail
      if (data && typeof data === 'object') {
        const first = Object.values(data).flat()[0]
        if (first) return String(first)
      }
      return fallback
    }

    async function guardarAtendimento() {
      const userId = formAtendimento.value.userId
      if (!userId) {
        $q.notify({ type: 'warning', message: 'Seleccione o utilizador.' })
        return
      }
      if (!formAtendimento.value.feedback) {
        $q.notify({ type: 'warning', message: 'Seleccione o feedback.' })
        return
      }
      if (!formAtendimento.value.persona) {
        $q.notify({ type: 'warning', message: 'Seleccione a persona.' })
        return
      }
      if (formAtendimento.value.persona === 'prep_exame_inatro' && !formAtendimento.value.persona_subtipo) {
        $q.notify({ type: 'warning', message: 'Seleccione se tem data marcada (INATRO).' })
        return
      }
      if (formAtendimento.value.persona === 'iniciante' && !formAtendimento.value.persona_subtipo) {
        $q.notify({ type: 'warning', message: 'Seleccione com tempo ou sem tempo (Iniciante).' })
        return
      }

      const contactado_em = buildContactadoEmFromForm(formAtendimento.value)
      if (!contactado_em) {
        $q.notify({ type: 'warning', message: 'Indique a data do contacto.' })
        return
      }

      savingAtendimento.value = true
      try {
        await api.post(`/users/${userId}/atendimentos/`, {
          contactado_em,
          feedback: formAtendimento.value.feedback,
          persona: formAtendimento.value.persona,
          persona_subtipo: formAtendimento.value.persona_subtipo || '',
          numero_pagamento: formAtendimento.value.numero_pagamento || '',
          nova_versao: formAtendimento.value.nova_versao,
          usa_android: formAtendimento.value.usa_android,
          usa_iphone: formAtendimento.value.usa_iphone,
          mesmo_celular_app: formAtendimento.value.mesmo_celular_app || '',
          como_soube: formAtendimento.value.como_soube || '',
          observacoes: formAtendimento.value.observacoes || '',
        })
        $q.notify({ type: 'positive', message: 'Atendimento registado com sucesso.' })
        closeRegistarAtendimento()
        if (viewMode.value === 'registos') {
          await loadAtendimentos()
        }
      } catch (err) {
        $q.notify({ type: 'negative', message: parseApiError(err, 'Erro ao guardar atendimento') })
      } finally {
        savingAtendimento.value = false
      }
    }

    function openEditarAtendimento(row) {
      editAtendimentoId.value = row.id
      editAtendimentoMeta.value = row
      formEditAtendimento.value = formFromAtendimentoRow(row)
      resetPagamentoBuscaEdit()
      dialogEditarAtendimento.value = true
      if (!row.numero_pagamento && row.target_user_telefone) {
        buscarPagamentoParaAtendimento('edit')
      }
    }

    function openEditarAtendimentoFromDetalhe() {
      if (!atendimentoDetalhe.value) return
      dialogDetalheAtendimento.value = false
      openEditarAtendimento(atendimentoDetalhe.value)
    }

    function closeEditarAtendimento() {
      dialogEditarAtendimento.value = false
      editAtendimentoId.value = null
      editAtendimentoMeta.value = null
      resetPagamentoBuscaEdit()
    }

    async function guardarEdicaoAtendimento() {
      const id = editAtendimentoId.value
      if (!id) return

      if (!formEditAtendimento.value.feedback) {
        $q.notify({ type: 'warning', message: 'Seleccione o feedback.' })
        return
      }
      if (!formEditAtendimento.value.persona) {
        $q.notify({ type: 'warning', message: 'Seleccione a persona.' })
        return
      }
      if (formEditAtendimento.value.persona === 'prep_exame_inatro' && !formEditAtendimento.value.persona_subtipo) {
        $q.notify({ type: 'warning', message: 'Seleccione se tem data marcada (INATRO).' })
        return
      }
      if (formEditAtendimento.value.persona === 'iniciante' && !formEditAtendimento.value.persona_subtipo) {
        $q.notify({ type: 'warning', message: 'Seleccione com tempo ou sem tempo (Iniciante).' })
        return
      }

      const contactado_em = buildContactadoEmFromForm(formEditAtendimento.value)
      if (!contactado_em) {
        $q.notify({ type: 'warning', message: 'Indique a data do contacto.' })
        return
      }

      savingEditAtendimento.value = true
      try {
        const f = formEditAtendimento.value
        const { data } = await api.patch(`/atendimentos/${id}/`, {
          contactado_em,
          feedback: f.feedback,
          persona: f.persona,
          persona_subtipo: f.persona_subtipo || '',
          numero_pagamento: f.numero_pagamento || '',
          nova_versao: f.nova_versao,
          usa_android: f.usa_android,
          usa_iphone: f.usa_iphone,
          mesmo_celular_app: f.mesmo_celular_app || '',
          como_soube: f.como_soube || '',
          observacoes: f.observacoes || '',
        })
        $q.notify({ type: 'positive', message: 'Atendimento actualizado.' })
        closeEditarAtendimento()
        if (viewMode.value === 'registos') {
          await loadAtendimentos()
        }
        if (atendimentoDetalhe.value?.id === id) {
          atendimentoDetalhe.value = data
        }
      } catch (err) {
        $q.notify({ type: 'negative', message: parseApiError(err, 'Erro ao actualizar atendimento') })
      } finally {
        savingEditAtendimento.value = false
      }
    }

    function showRegistos() {
      viewMode.value = 'registos'
      loadAtendimentos()
    }

    function openDetalheAtendimento(row) {
      atendimentoDetalhe.value = row
      dialogDetalheAtendimento.value = true
    }

    function shouldPauseRefresh() {
      return (
        dialogRegistarLigacao.value ||
        savingCall.value ||
        dialogRegistarAtendimento.value ||
        savingAtendimento.value ||
        dialogEditarAtendimento.value ||
        savingEditAtendimento.value ||
        viewMode.value !== 'leads'
      )
    }

    onMounted(() => {
      restoreState()
      loadUsers()
      refreshTimer = setInterval(() => {
        if (shouldPauseRefresh()) return
        loadUsers({ silent: true, preservePosition: true })
      }, AUTO_REFRESH_MS)
    })

    onBeforeUnmount(() => {
      if (refreshTimer) clearInterval(refreshTimer)
    })

    watch([dateFrom, dateTo], saveState)
    watch(pagination, saveState, { deep: true })
    watch(
      () => formEditAtendimento.value.persona,
      (persona) => {
        if (persona !== 'prep_exame_inatro' && persona !== 'iniciante') {
          formEditAtendimento.value.persona_subtipo = ''
        }
      }
    )

    return {
      loading,
      rows,
      columns,
      dateFrom,
      dateTo,
      pagination,
      formatDate,
      formatDateTime,
      loadUsers,
      clearDates,
      goToUser,
      dialogRegistarLigacao,
      targetUserForCall,
      savingCall,
      novaLigacaoData,
      openRegistarLigacao,
      guardarLigacao,
      viewMode,
      dialogRegistarAtendimento,
      savingAtendimento,
      formAtendimento,
      userSearchOptions,
      userSearchLoading,
      selectedAtendimentoUser,
      pagamentoBuscaLoading,
      pagamentoBuscaFeita,
      pagamentosEncontrados,
      pagamentosEncontradosOptions,
      pagamentoSelecionadoKey,
      pagamentoBuscaEditLoading,
      pagamentoBuscaEditFeita,
      pagamentosEncontradosEdit,
      pagamentosEncontradosEditOptions,
      pagamentoSelecionadoEditKey,
      buscarPagamentoParaAtendimento,
      onPagamentoSelecionadoChange,
      feedbackOptions,
      personaOptions,
      personaSubtipoInatroOptions,
      personaSubtipoInicianteOptions,
      mesmoCelularOptions,
      openRegistarAtendimento,
      closeRegistarAtendimento,
      onAtendimentoUserSelected,
      filterUsersForAtendimento,
      guardarAtendimento,
      loadingAtendimentos,
      atendimentosRows,
      atendimentosColumns,
      filtroAtendDateFrom,
      filtroAtendDateTo,
      filtroAtendFeedback,
      filtroAtendPersona,
      filtroAtendTelefone,
      filtroAtendOnlyMine,
      loadAtendimentos,
      showRegistos,
      dialogDetalheAtendimento,
      atendimentoDetalhe,
      openDetalheAtendimento,
      dialogEditarAtendimento,
      editAtendimentoMeta,
      formEditAtendimento,
      savingEditAtendimento,
      openEditarAtendimento,
      openEditarAtendimentoFromDetalhe,
      closeEditarAtendimento,
      guardarEdicaoAtendimento,
    }
  },
}
</script>

<style scoped>
.sticky-header-table :deep(thead tr th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
}
.body--dark .sticky-header-table :deep(thead tr th) {
  background: #1e1e1e;
}

.chip-date-btn {
  border-radius: 16px;
  background: rgba(25, 118, 210, 0.2);
}
.chip-date-btn:hover {
  background: rgba(25, 118, 210, 0.35);
}

/* Dialog registar atendimento */
.atendimento-dialog-card {
  width: 640px;
  max-width: 96vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.atendimento-dialog-header {
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
  color: white;
  flex-shrink: 0;
}

.atendimento-dialog-body {
  flex: 1;
  min-height: 0;
  background: #f5f7fa;
}

.atendimento-scroll-area {
  height: min(68vh, 560px);
}

.form-section {
  background: white;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.form-section-last {
  margin-bottom: 4px;
}

.form-section-highlight {
  border-color: #a5d6a7;
  background: #f1f8f4;
}

.form-section-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #1b5e20;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
}

.user-preview-card {
  background: #e8f5e9;
  border-color: #a5d6a7 !important;
}

.feedback-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.feedback-chip {
  font-size: 0.8rem;
  min-height: 36px;
}

.subtipo-box {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.atendimento-dialog-actions {
  flex-shrink: 0;
  background: white;
}

.body--dark .atendimento-dialog-body {
  background: #1a1a1a;
}

.body--dark .form-section {
  background: #2d2d2d;
  border-color: rgba(255, 255, 255, 0.1);
}

.body--dark .user-preview-card {
  background: rgba(46, 125, 50, 0.15);
  border-color: rgba(129, 199, 132, 0.4) !important;
}

.body--dark .subtipo-box {
  background: #333;
}

.body--dark .form-section-highlight {
  background: rgba(46, 125, 50, 0.12);
  border-color: rgba(129, 199, 132, 0.35);
}

.body--dark .atendimento-dialog-actions {
  background: #2d2d2d;
}
</style>
