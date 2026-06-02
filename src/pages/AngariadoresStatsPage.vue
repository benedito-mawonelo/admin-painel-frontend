<template>
  <q-page class="ang-stats-page q-pa-lg">
    <!-- Cabeçalho -->
    <div class="row items-end q-col-gutter-md q-mb-lg">
      <div class="col-12 col-lg-5">
        <div class="text-h5 text-weight-bold text-grey-9">
          Performance dos angariadores
        </div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Leads angariados, conversões e pendências · {{ tituloResultados }}
        </div>
      </div>
      <div class="col-12 col-lg-7 text-right">
        <q-btn
          outline
          color="primary"
          icon="download"
          label="Exportar CSV"
          no-caps
          :disable="!resultados.length"
          @click="exportarCsv"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-card flat bordered class="stats-panel-card stats-filters-sticky q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-auto">
            <div class="text-caption text-grey-7 q-mb-xs text-uppercase text-weight-medium">
              Período
            </div>
            <q-btn-toggle
              v-model="periodo"
              no-caps
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="[
                { label: 'Dia', value: 'dia' },
                { label: 'Semana', value: 'semana' },
                { label: 'Mês', value: 'mes' }
              ]"
            />
          </div>

          <template v-if="periodo === 'mes'">
            <div class="col-6 col-md-2">
              <q-input v-model.number="mes" type="number" min="1" max="12" outlined dense label="Mês" />
            </div>
            <div class="col-6 col-md-2">
              <q-input v-model.number="ano" type="number" min="2000" max="2100" outlined dense label="Ano" />
            </div>
          </template>
          <template v-else-if="periodo === 'dia'">
            <div class="col-12 col-md-4">
              <q-input v-model="dataDiaDisplay" outlined dense readonly label="Dia">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dataDiaPicker" mask="YYYY-MM-DD" minimal>
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup label="Fechar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </template>
          <template v-else>
            <div class="col-12 col-md-5">
              <q-input
                v-model="dataSemanaDisplay"
                outlined
                dense
                readonly
                label="Semana (ISO)"
                :hint="intervaloSemanaHint"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dataSemanaPicker" mask="YYYY-MM-DD" minimal>
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup label="Fechar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </template>

          <div class="col-12 col-md-4">
            <q-select
              v-model="angariadorSeleccionado"
              outlined
              dense
              clearable
              use-input
              fill-input
              hide-selected
              input-debounce="300"
              label="Filtrar angariador"
              placeholder="Nome, apelido ou telefone"
              :options="angariadorOptions"
              option-label="label"
              :loading="angariadorSearchLoading"
              @filter="filtrarAngariadores"
              @update:model-value="onAngariadorSeleccionado"
              @clear="onAngariadorLimpo"
              @keyup.enter="carregar"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">Digite pelo menos 2 caracteres…</q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label v-if="scope.opt.telefone" caption>{{ scope.opt.telefone }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-auto">
            <q-toggle
              v-model="compararPeriodo"
              dense
              color="primary"
              label="Comparar com período anterior"
              @update:model-value="carregar"
            />
          </div>

          <div class="col-12 col-md-auto">
            <q-btn
              color="primary"
              icon="refresh"
              label="Actualizar"
              no-caps
              unelevated
              :loading="loading"
              @click="carregar"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-inner-loading :showing="loading" color="primary">
      <q-spinner-dots size="48px" color="primary" />
    </q-inner-loading>

    <!-- ——— PRIMEIRA PARTE (layout referência) ——— -->

    <q-banner
      v-if="avisoTotaisPlataforma"
      rounded
      class="stats-alert-banner q-mb-md"
      dense
    >
      <template v-slot:avatar>
        <q-icon name="info" color="warning" />
      </template>
      A API não devolveu totais da plataforma. Verifique o deploy do backend ou <code>VITE_API_URL</code>.
    </q-banner>

    <div v-if="alertaGlobalPlataforma && !loading" class="stats-alert-line q-mb-md">
      <q-icon name="notifications" size="20px" class="q-mr-sm text-warning" />
      <span class="text-body2">
        <strong>Atenção:</strong> {{ alertaGlobalPlataforma }}
      </span>
    </div>

    <!-- KPIs resumo (4 + métrica em falta) -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="kpi in kpisTopo"
        :key="kpi.key"
        class="col-12"
        :class="kpi.colClass"
      >
        <q-card flat bordered class="stats-kpi-card stats-kpi-card--compact">
          <q-card-section class="q-py-md">
            <div class="text-caption text-grey-7 text-uppercase stats-kpi-label">
              {{ kpi.label }}
            </div>
            <div class="text-h4 text-weight-bold q-mt-xs q-mb-xs" :class="kpi.valueClass">
              {{ kpi.value }}
            </div>
            <div class="text-caption" :class="kpi.hintClass">
              {{ kpi.hint }}
            </div>
            <div
              v-if="kpi.comparacao"
              class="text-caption text-weight-medium q-mt-xs"
              :class="kpi.comparacao.class"
            >
              <q-icon :name="kpi.comparacao.icon" size="14px" class="q-mr-xs" />
              {{ kpi.comparacao.label }}
              <span class="text-grey-6"> vs {{ tituloPeriodoAnterior }}</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Comparativo período actual vs anterior -->
    <q-card
      v-if="compararPeriodo && comparacaoDisponivel"
      flat
      bordered
      class="stats-panel-card stats-compare-card q-mb-lg"
    >
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col">
            <div class="text-subtitle1 text-weight-bold text-grey-9">
              Comparativo de períodos
            </div>
            <div class="text-caption text-grey-7">
              {{ tituloResultados }}
              <q-icon name="compare_arrows" size="16px" class="q-mx-xs" />
              {{ tituloPeriodoAnterior }}
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div
            v-for="bloco in comparativoResumoBlocos"
            :key="bloco.key"
            class="col-12 col-sm-6 col-md-3"
          >
            <div class="stats-compare-metric">
              <div class="text-caption text-grey-7">{{ bloco.label }}</div>
              <div class="row items-baseline q-gutter-sm q-mt-xs">
                <span class="text-h6 text-weight-bold">{{ bloco.actual }}</span>
                <span class="text-body2 text-grey-6">/ {{ bloco.anterior }}</span>
              </div>
              <div class="text-caption q-mt-xs" :class="bloco.variacao.class">
                <q-icon :name="bloco.variacao.icon" size="14px" class="q-mr-xs" />
                {{ bloco.variacao.label }}
              </div>
            </div>
          </div>
        </div>

        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">
          Por angariador
        </div>
        <q-markup-table flat bordered separator="horizontal" class="stats-compare-table">
          <thead>
            <tr>
              <th class="text-left">Angariador</th>
              <th class="text-center">Leads</th>
              <th class="text-center">Convertidos</th>
              <th class="text-center">Pontos</th>
              <th class="text-center">Taxa conv.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in resultadosComparacao" :key="`cmp-${row.angariador_id}`">
              <td class="text-weight-medium">{{ row.nome }}</td>
              <td class="text-center">
                <div>{{ row.total_angariados }}</div>
                <div class="text-caption text-grey-6">
                  ant. {{ row.anterior.total_angariados }}
                  <span :class="row.variacao.leads.class"> · {{ row.variacao.leads.label }}</span>
                </div>
              </td>
              <td class="text-center">
                <div>{{ row.total_convertidos }}</div>
                <div class="text-caption text-grey-6">
                  ant. {{ row.anterior.total_convertidos }}
                  <span :class="row.variacao.convertidos.class"> · {{ row.variacao.convertidos.label }}</span>
                </div>
              </td>
              <td class="text-center">
                <div>{{ row.total_pontos }}</div>
                <div class="text-caption text-grey-6">
                  ant. {{ row.anterior.total_pontos }}
                  <span :class="row.variacao.pontos.class"> · {{ row.variacao.pontos.label }}</span>
                </div>
              </td>
              <td class="text-center">
                <div>{{ row.taxa_conversao }}%</div>
                <div class="text-caption text-grey-6">
                  ant. {{ row.anterior.taxa_conversao }}%
                  <span :class="row.variacao.taxa.class"> · {{ row.variacao.taxa.label }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <div v-if="!resultadosComparacao.length" class="text-caption text-grey-6 q-mt-md text-center">
          Sem dados nos dois períodos para comparar.
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="stats-panel-card q-mb-lg">
      <q-card-section class="q-py-sm">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-auto text-caption text-grey-7 text-weight-medium">
            Chamadas registadas:
          </div>
          <div class="col-auto">
            <q-btn-toggle
              v-model="modoChamadas"
              no-caps
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="[
                { label: 'Geral', value: 'geral' },
                { label: 'Por angariador', value: 'por_angariador' }
              ]"
            />
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section v-if="modoChamadas === 'por_angariador'">
        <div v-if="chamadasPorAngariador.length" class="row q-col-gutter-sm">
          <div
            v-for="item in chamadasPorAngariador.slice(0, 8)"
            :key="`call-ang-${item.nome}`"
            class="col-12 col-sm-6 col-md-4"
          >
            <div class="row items-center justify-between text-body2">
              <span class="ellipsis">{{ item.nome }}</span>
              <q-chip dense color="primary" text-color="white">{{ item.total }}</q-chip>
            </div>
          </div>
        </div>
        <div v-else class="text-caption text-grey-6">
          Sem chamadas registadas no período seleccionado.
        </div>
      </q-card-section>
      <q-card-section v-else>
        <div class="text-body2 text-grey-8">
          Total de chamadas registadas no período: <strong>{{ chamadasResumo.total }}</strong>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="mixPacotes.pacotes?.length" flat bordered class="stats-panel-card q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">
          Pacotes mais vendidos no geral
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          Todos os pagamentos concluídos no período (angariadores + app normal)
          <span class="q-ml-xs">
            · Total {{ pacotesGeral.total_pagamentos || 0 }}
          </span>
        </div>
        <div class="stats-chart-wrap">
          <Bar :data="chartPacotesGeraisData" :options="chartPacotesGeraisOptions" />
        </div>
        <div v-if="!chartPacotesGeraisTemDados" class="text-caption text-grey-6 text-center q-mt-sm">
          Sem conversões por pacote neste período.
        </div>
      </q-card-section>
    </q-card>

    <q-separator class="q-my-xl" />

    <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm section-label">
      Metas e panorama
    </div>

    <!-- Snapshot plataforma -->
    <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm section-label">
      Panorama da plataforma · {{ textoReferenciaTemporal }}
    </div>
    <div class="row q-col-gutter-md q-mb-xl">
      <div v-for="snap in snapshotsPlataforma" :key="snap.key" class="col-12 col-md-4">
        <q-card flat bordered class="stats-snap-card" :class="snap.cardClass">
          <q-card-section>
            <div class="text-caption text-grey-8">{{ snap.title }}</div>
            <div class="text-h5 text-weight-bold q-my-xs">{{ snap.leads }}</div>
            <div class="text-body2 text-grey-7">
              <span class="text-weight-medium text-positive">{{ snap.convertidos }}</span> convertidos
              <span class="q-mx-xs">·</span>
              <q-badge :color="snap.taxaColor" text-color="white" :label="`${snap.taxa}%`" />
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">{{ snap.rotulo }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="stats-panel-card q-mb-xl">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">
          Indicadores de conformidade do período
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          Totais globais da consulta actual
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Convertidos fora dos 15 min</div>
            <div class="text-h5 text-weight-bold text-warning q-mt-xs">
              {{ resumo.total_convertidos_fora_15m ?? 0 }}
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Planos desbloqueados no painel</div>
            <div class="text-h5 text-weight-bold text-info q-mt-xs">
              {{ resumo.total_convertidos_via_painel ?? 0 }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="stats-section-title q-mb-md q-mt-lg">
      PERFORMANCE POR ANGARIADOR
    </div>

    <div v-if="!resultadosPerformance.length && !loading" class="q-mb-xl">
      <q-card flat bordered class="stats-panel-card">
        <q-card-section class="text-center text-grey-7 q-py-xl">
          <q-icon name="group_off" size="48px" color="grey-5" class="q-mb-md" />
          <div>Sem dados para o filtro seleccionado.</div>
        </q-card-section>
      </q-card>
    </div>

    <template v-else>
      <!-- Máx. 3 banners — um angariador por linha -->
      <div class="q-mb-lg">
        <div
          v-for="row in resultadosPerformance"
          :key="`banner-${chaveAngariador(row)}`"
          class="stats-alert-line q-mb-sm"
        >
          <q-icon name="notifications" size="20px" class="q-mr-sm text-warning" />
          <span class="text-body2">
            <strong>Atenção — {{ row.nome }}:</strong> {{ textoBannerAngariador(row) }}
          </span>
        </div>
      </div>

      <div class="row q-col-gutter-lg q-mb-xl">
        <div
          v-for="(row, idx) in resultadosPerformance"
          :key="`card-${chaveAngariador(row)}`"
          class="col-12 col-md-4"
        >
          <q-card
            flat
            bordered
            class="stats-person-card"
            :class="classeCartaoAngariador(row)"
          >
            <q-card-section>
              <div class="row items-center q-mb-lg no-wrap">
              <q-avatar
                size="52px"
                :color="avatarCorReferencia(idx)"
                text-color="white"
                class="text-weight-bold text-h6"
              >
                {{ iniciais(row.nome) }}
              </q-avatar>
              <div class="col q-pl-md">
                <div class="text-h6 text-weight-bold ellipsis">{{ row.nome }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Taxa: {{ row.taxa_conversao }}% · {{ etiquetaDesempenho(row) }}
                </div>
              </div>
            </div>

            <div class="stats-metric-list stats-metric-list--ref">
              <div class="stats-metric-row">
                <span>Leads angariados</span>
                <strong>
                  {{ row.total_angariados }}
                  <span
                    v-if="variacaoAngariador(row, 'total_angariados')"
                    class="text-caption q-ml-xs"
                    :class="variacaoAngariador(row, 'total_angariados').class"
                  >
                    {{ variacaoAngariador(row, 'total_angariados').label }}
                  </span>
                </strong>
              </div>
              <div class="stats-metric-row">
                <span>Convertidos</span>
                <strong>
                  {{ row.total_convertidos }}
                  <span
                    v-if="variacaoAngariador(row, 'total_convertidos')"
                    class="text-caption q-ml-xs"
                    :class="variacaoAngariador(row, 'total_convertidos').class"
                  >
                    {{ variacaoAngariador(row, 'total_convertidos').label }}
                  </span>
                </strong>
              </div>
              <div class="stats-metric-row">
                <span>Pending ativos</span>
                <strong>{{ row.pending_activos }}</strong>
              </div>
              <div class="stats-metric-row">
                <span>Expirados</span>
                <strong>{{ row.pending_expirados }}</strong>
              </div>
              <div class="stats-metric-row">
                <span>Convertidos fora 15 min</span>
                <strong :class="(row.convertidos_fora_15m || 0) > 0 ? 'text-warning' : ''">
                  {{ row.convertidos_fora_15m ?? 0 }}
                </strong>
              </div>
              <div class="stats-metric-row">
                <span>Planos desbloqueados no painel</span>
                <strong :class="(row.convertidos_via_painel || 0) > 0 ? 'text-info' : ''">
                  {{ row.convertidos_via_painel ?? 0 }}
                </strong>
              </div>
            </div>

            <div class="q-mt-sm">
              <div class="text-caption text-grey-7 q-mb-xs">Pacotes mais vendidos</div>
              <div
                v-if="topPacotesAngariador(row).length"
                class="row items-center q-col-gutter-xs"
              >
                <div
                  v-for="pkg in topPacotesAngariador(row)"
                  :key="`pkg-${chaveAngariador(row)}-${pkg.nome}`"
                  class="col-auto"
                >
                  <q-chip dense outline color="primary">
                    {{ pkg.nome }} · {{ pkg.total }}
                  </q-chip>
                </div>
              </div>
              <div v-else class="text-caption text-grey-6">
                Sem conversões por pacote neste período.
              </div>
            </div>

            <div class="q-mt-lg">
              <div class="row items-center text-caption text-grey-8 q-mb-xs">
                <span>Meta {{ rotuloMetaPeriodo }} conversão</span>
                <span class="q-ml-auto text-weight-medium">
                  {{ row.total_convertidos }}/{{ metasPeriodo.conv }}
                </span>
              </div>
              <q-linear-progress
                :value="progressoMeta(row.total_convertidos, metasPeriodo.conv)"
                rounded
                size="8px"
                :color="corBarraMeta(row.total_convertidos, metasPeriodo.conv)"
                track-color="grey-4"
              />
            </div>

            <div class="q-mt-md">
              <div class="row items-center text-caption text-grey-8 q-mb-xs">
                <span>Meta {{ rotuloMetaPeriodo }} leads</span>
                <span class="q-ml-auto text-weight-medium">
                  {{ row.total_angariados }}/{{ metasPeriodo.leads }}
                </span>
              </div>
              <q-linear-progress
                :value="progressoMeta(row.total_angariados, metasPeriodo.leads)"
                rounded
                size="8px"
                :color="corBarraMeta(row.total_angariados, metasPeriodo.leads)"
                track-color="grey-4"
              />
            </div>
          </q-card-section>
        </q-card>
        </div>
      </div>
    </template>

    <!-- Mix de pacotes — barras agrupadas (top 4 angariadores) -->
    <q-card v-if="resultados.length" flat bordered class="stats-panel-card q-mb-xl">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-xs">
          Mix de pacotes vendidos — {{ tituloPeriodoGrafico }}
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          Top {{ mixPacotes.angariadores.length }} angariadores no período · barras agrupadas por pacote
        </div>
        <div v-if="chartMostrar" class="stats-chart-wrap stats-chart-wrap--mix">
          <Bar :key="chartInstanceKey" :data="chartData" :options="chartOptions" />
          <div
            v-if="!chartTemDados"
            class="text-caption text-grey-6 text-center q-mt-sm"
          >
            Sem conversões com pacote identificado; barras a zero para comparação entre angariadores.
          </div>
        </div>
        <div v-else class="text-center text-grey-6 q-py-lg">
          Sem angariadores no período para o gráfico.
        </div>
      </q-card-section>
    </q-card>

    <!-- Metas diárias por pacote -->
    <q-card v-if="metasAngariadores.length" flat bordered class="stats-panel-card q-mb-lg">
      <q-card-section class="q-pb-sm">
        <div class="stats-section-title q-mb-xs">METAS DIÁRIAS</div>
        <div class="text-subtitle1 text-weight-bold text-grey-9">
          Progresso de {{ metasPacotes.referencia_dia_rotulo || 'hoje' }}
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-markup-table flat bordered separator="horizontal" class="metas-pacote-table">
          <thead>
            <tr>
              <th class="text-left text-weight-bold">Pacote</th>
              <th class="text-center text-weight-bold">Meta diária</th>
              <th
                v-for="ang in metasAngariadores"
                :key="`d-head-${chaveAngariador(ang)}`"
                class="text-center text-weight-bold"
              >
                {{ labelAngariadorGrafico(ang) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(pacote, pIdx) in metasPacotes.pacotes"
              :key="`d-row-${pacote}`"
            >
              <td class="text-grey-9">{{ pacote }}</td>
              <td class="text-center text-weight-medium">
                {{ metasPacotes.metas_diarias[pIdx] }}
              </td>
              <td
                v-for="ang in metasAngariadores"
                :key="`d-cell-${pacote}-${chaveAngariador(ang)}`"
                class="text-center"
              >
                <span
                  class="meta-chip"
                  :class="classeChipMeta(ang.progresso_dia[pIdx], metasPacotes.metas_diarias[pIdx])"
                >
                  {{ ang.progresso_dia[pIdx] ?? 0 }}/{{ metasPacotes.metas_diarias[pIdx] }}
                </span>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>

      <q-card-section class="text-center q-py-sm">
        <q-btn
          round
          unelevated
          color="grey-3"
          text-color="grey-8"
          :icon="metasMensaisVisivel ? 'expand_less' : 'expand_more'"
          :aria-label="metasMensaisVisivel ? 'Ocultar metas mensais' : 'Ver metas do mês'"
          @click="metasMensaisVisivel = !metasMensaisVisivel"
        />
        <div class="text-caption text-grey-6 q-mt-xs">
          {{ metasMensaisVisivel ? 'Ocultar metas mensais' : 'Ver metas de todo o mês' }}
        </div>
      </q-card-section>

      <q-slide-transition>
        <div v-show="metasMensaisVisivel">
          <q-separator />
          <q-card-section>
            <div class="stats-section-title q-mb-xs">METAS MENSAIS</div>
            <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md">
              Progresso de {{ metasPacotes.referencia_mes || tituloResultados }}
            </div>
            <q-markup-table flat bordered separator="horizontal" class="metas-pacote-table">
              <thead>
                <tr>
                  <th class="text-left text-weight-bold">Pacote</th>
                  <th class="text-center text-weight-bold">Meta mensal</th>
                  <th
                    v-for="ang in metasAngariadores"
                    :key="`m-head-${chaveAngariador(ang)}`"
                    class="text-center text-weight-bold"
                  >
                    {{ labelAngariadorGrafico(ang) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(pacote, pIdx) in metasPacotes.pacotes"
                  :key="`m-row-${pacote}`"
                >
                  <td class="text-grey-9">{{ pacote }}</td>
                  <td class="text-center text-weight-medium">
                    {{ metasPacotes.metas_mensais[pIdx] }}
                  </td>
                  <td
                    v-for="ang in metasAngariadores"
                    :key="`m-cell-${pacote}-${chaveAngariador(ang)}`"
                    class="text-center"
                  >
                    <span
                      class="meta-chip"
                      :class="classeChipMeta(ang.progresso_mes[pIdx], metasPacotes.metas_mensais[pIdx])"
                    >
                      {{ ang.progresso_mes[pIdx] ?? 0 }}/{{ metasPacotes.metas_mensais[pIdx] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </div>
      </q-slide-transition>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import {
  format,
  subDays,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const AVATAR_CORES = ['primary', 'secondary', 'info', 'accent', 'positive', 'warning']
const AVATAR_CORES_REF = ['positive', 'info', 'warning']

const METAS_POR_PERIODO = {
  dia: { conv: 3, leads: 5 },
  semana: { conv: 25, leads: 30 },
  mes: { conv: 80, leads: 100 },
}

function fromYMD(ymd) {
  const parts = String(ymd || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date(NaN)
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

function calcVariacao(actual, anterior) {
  const a = Number(actual) || 0
  const p = Number(anterior) || 0
  const delta = a - p
  if (delta === 0) {
    return { delta: 0, label: 'igual', class: 'text-grey-7', icon: 'remove' }
  }
  const pct = p > 0 ? Math.round((delta / p) * 1000) / 10 : null
  const sinal = delta > 0 ? '+' : ''
  const pctTxt = pct != null ? ` (${sinal}${pct}%)` : ''
  const label = `${sinal}${delta}${pctTxt}`
  if (delta > 0) {
    return { delta, label, class: 'text-positive', icon: 'trending_up' }
  }
  return { delta, label, class: 'text-negative', icon: 'trending_down' }
}

function iniciais(nome) {
  const parts = String(nome || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase()
}

const MAX_CARTOES_PERFORMANCE = 3
const MAX_ANGARIADORES_GRAFICO = 4

const CHART_CORES_ANGARIADOR = [
  'rgba(25, 118, 210, 0.88)',
  'rgba(38, 166, 154, 0.88)',
  'rgba(255, 152, 0, 0.88)',
  'rgba(156, 39, 176, 0.88)',
]

const PACOTES_LABELS_FALLBACK = [
  'Básico',
  'Pro-Max',
  'Profissional',
  'Teóricas',
  'Práticas L.',
  'Práticas P.',
]

const METAS_DIARIAS_FALLBACK = [6, 3, 5, 2, 3, 3]
const METAS_MENSAIS_FALLBACK = METAS_DIARIAS_FALLBACK.map((m) => m * 22)

function chaveAngariador(row) {
  const id = row?.angariador_id ?? row?.id
  if (id != null && id !== '') return String(id)
  const nome = String(row?.nome || '').trim().toLowerCase()
  const user = String(row?.username || '').trim().toLowerCase()
  return `n:${nome}|u:${user}`
}

function deduplicarResultados(rows) {
  if (!Array.isArray(rows)) return []
  const byKey = new Map()
  for (const row of rows) {
    const key = chaveAngariador(row)
    const normalizado = {
      ...row,
      angariador_id: row.angariador_id ?? row.id ?? null,
    }
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, normalizado)
      continue
    }
    if ((normalizado.total_pontos || 0) > (existing.total_pontos || 0)) {
      byKey.set(key, normalizado)
    }
  }
  return Array.from(byKey.values())
}

function ordenarResultados(rows) {
  return [...rows].sort((a, b) => {
    if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos
    return b.total_convertidos - a.total_convertidos
  })
}

/** Garante até 4 angariadores no gráfico (top do período), com mix da API por ID. */
function enriquecerMixPacotes(mix, resultadosSorted) {
  const pacotes = mix?.pacotes?.length ? mix.pacotes : PACOTES_LABELS_FALLBACK
  const zeros = () => pacotes.map(() => 0)
  const byId = new Map()
  for (const a of mix?.angariadores || []) {
    const id = a?.angariador_id
    if (id == null || id === '') continue
    const key = String(id)
    if (!byId.has(key)) {
      byId.set(key, {
        angariador_id: id,
        nome: a.nome,
        username: a.username || '',
        valores: [...(a.valores || zeros())],
      })
    }
  }
  const out = []
  for (const row of resultadosSorted) {
    if (out.length >= MAX_ANGARIADORES_GRAFICO) break
    const id = row.angariador_id ?? row.id
    if (id == null || id === '') continue
    const key = String(id)
    if (out.some((x) => String(x.angariador_id) === key)) continue
    if (byId.has(key)) {
      out.push(byId.get(key))
    } else {
      out.push({
        angariador_id: id,
        nome: row.nome,
        username: row.username || '',
        valores: zeros(),
      })
    }
  }
  return { pacotes, angariadores: out }
}

function enriquecerMetasPacotes(metas, resultadosSorted) {
  const pacotes = metas?.pacotes?.length ? metas.pacotes : PACOTES_LABELS_FALLBACK
  const metasDiarias = metas?.metas_diarias?.length
    ? metas.metas_diarias
    : METAS_DIARIAS_FALLBACK
  const metasMensais = metas?.metas_mensais?.length
    ? metas.metas_mensais
    : METAS_MENSAIS_FALLBACK
  const zeros = () => pacotes.map(() => 0)
  const byId = new Map()
  for (const a of metas?.angariadores || []) {
    const id = a?.angariador_id
    if (id == null || id === '') continue
    const key = String(id)
    if (!byId.has(key)) {
      byId.set(key, {
        angariador_id: id,
        nome: a.nome,
        username: a.username || '',
        progresso_dia: [...(a.progresso_dia || zeros())],
        progresso_mes: [...(a.progresso_mes || zeros())],
      })
    }
  }
  const angariadores = []
  for (const row of resultadosSorted) {
    if (angariadores.length >= MAX_ANGARIADORES_GRAFICO) break
    const id = row.angariador_id ?? row.id
    if (id == null || id === '') continue
    const key = String(id)
    if (angariadores.some((x) => String(x.angariador_id) === key)) continue
    if (byId.has(key)) {
      angariadores.push(byId.get(key))
    } else {
      angariadores.push({
        angariador_id: id,
        nome: row.nome,
        username: row.username || '',
        progresso_dia: zeros(),
        progresso_mes: zeros(),
      })
    }
  }
  return {
    pacotes,
    metas_diarias: metasDiarias,
    metas_mensais: metasMensais,
    referencia_dia: metas?.referencia_dia || '',
    referencia_dia_rotulo: metas?.referencia_dia_rotulo || '',
    referencia_mes: metas?.referencia_mes || '',
    angariadores,
  }
}

function labelAngariadorGrafico(ang) {
  const nome = String(ang.nome || '').trim() || 'Angariador'
  const user = String(ang.username || '').trim()
  if (user && user.toLowerCase() !== nome.toLowerCase()) {
    return user.length > 12 ? `${nome} (${user.slice(0, 10)}…)` : `${nome} (${user})`
  }
  if (ang.angariador_id != null) return `${nome} #${ang.angariador_id}`
  return nome
}

export default {
  name: 'AngariadoresStatsPage',
  components: { Bar },
  setup() {
    const $q = useQuasar()
    const now = new Date()
    const periodo = ref('mes')
    const compararPeriodo = ref(true)
    const mes = ref(now.getMonth() + 1)
    const ano = ref(now.getFullYear())
    const hojeIso = format(now, 'yyyy-MM-dd')
    const dataDiaPicker = ref(hojeIso)
    const dataSemanaPicker = ref(hojeIso)
    const q = ref('')
    const angariadorSeleccionado = ref(null)
    const angariadorOptions = ref([])
    const angariadorSearchLoading = ref(false)
    const loading = ref(false)
    const resumo = ref({})
    const totaisPlataforma = ref({})
    const resultadoStatsOk = ref(false)
    const resultados = ref([])
    const resumoAnterior = ref(null)
    const resultadosAnterior = ref([])
    const comparacaoCarregada = ref(false)
    const mixPacotes = ref({ pacotes: [], angariadores: [] })
    const pacotesGeral = ref({
      pacotes: [],
      totais: [],
      total_pagamentos: 0,
      total_via_angariacao: 0,
      total_pagamentos_normais: 0,
    })
    const metasPacotes = ref({
      pacotes: [],
      metas_diarias: [],
      metas_mensais: [],
      referencia_dia_rotulo: '',
      referencia_mes: '',
      angariadores: [],
    })
    const metasMensaisVisivel = ref(false)
    const modoChamadas = ref('geral')
    const chamadasResumo = ref({ total: 0, por_angariador: [] })
    const mesNome = ref('')

    const avisoTotaisPlataforma = computed(() => {
      if (loading.value || !resultadoStatsOk.value) return false
      const tp = totaisPlataforma.value
      return !tp?.referencia_data || !tp?.hoje
    })

    const textoReferenciaTemporal = computed(() => {
      const r = totaisPlataforma.value?.referencia_data
      if (!r) return '—'
      const d = fromYMD(r)
      if (Number.isNaN(d.getTime())) return r
      return format(d, "d 'de' MMMM 'de' yyyy", { locale: pt })
    })

    const intervaloSemanaPlataforma = computed(() => {
      const s = totaisPlataforma.value?.semana_actual?.data_inicio
      const e = totaisPlataforma.value?.semana_actual?.data_fim
      if (!s || !e) return ''
      const ds = fromYMD(s)
      const de = fromYMD(e)
      if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime())) return `${s} – ${e}`
      return `${format(ds, 'd MMM', { locale: pt })} – ${format(de, 'd MMM yyyy', { locale: pt })}`
    })

    const dataDiaDisplay = computed(() => {
      const d = fromYMD(dataDiaPicker.value)
      if (Number.isNaN(d.getTime())) return ''
      return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
    })

    const dataSemanaDisplay = computed(() => {
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return ''
      return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
    })

    const intervaloSemanaHint = computed(() => {
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return ''
      const s = startOfISOWeek(d)
      const e = endOfISOWeek(d)
      const w = getISOWeek(d)
      const yIso = getISOWeekYear(d)
      return `Semana ISO ${w}/${yIso} · ${format(s, 'd MMM', { locale: pt })} – ${format(e, 'd MMM yyyy', { locale: pt })}`
    })

    const tituloResultados = computed(() => {
      if (periodo.value === 'mes') {
        if (mesNome.value) return `${mesNome.value} / ${ano.value}`
        const d = new Date(ano.value, mes.value - 1, 1)
        if (Number.isNaN(d.getTime())) return '—'
        return format(d, 'MMMM yyyy', { locale: pt })
      }
      if (periodo.value === 'dia') return dataDiaDisplay.value || '—'
      return intervaloSemanaHint.value || '—'
    })

    const tituloPeriodoAnterior = computed(() => {
      if (periodo.value === 'mes') {
        let m = mes.value - 1
        let y = ano.value
        if (m < 1) {
          m = 12
          y -= 1
        }
        const d = new Date(y, m - 1, 1)
        if (Number.isNaN(d.getTime())) return '—'
        return format(d, 'MMMM yyyy', { locale: pt })
      }
      if (periodo.value === 'dia') {
        const d = fromYMD(dataDiaPicker.value)
        if (Number.isNaN(d.getTime())) return '—'
        const prev = subDays(d, 1)
        return format(prev, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
      }
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return '—'
      const prev = subDays(d, 7)
      const s = startOfISOWeek(prev)
      const e = endOfISOWeek(prev)
      const w = getISOWeek(prev)
      const yIso = getISOWeekYear(prev)
      return `Semana ISO ${w}/${yIso} · ${format(s, 'd MMM', { locale: pt })} – ${format(e, 'd MMM yyyy', { locale: pt })}`
    })

    const comparacaoDisponivel = computed(() => {
      return compararPeriodo.value && comparacaoCarregada.value && resumoAnterior.value != null
    })

    const mapaResultadosAnterior = computed(() => {
      const m = new Map()
      ;(resultadosAnterior.value || []).forEach((r) => {
        m.set(r.angariador_id, r)
      })
      return m
    })

    function variacaoAngariador(row, campo) {
      if (!comparacaoDisponivel.value) return null
      const ant = mapaResultadosAnterior.value.get(row.angariador_id)
      if (!ant) {
        const a = Number(row[campo]) || 0
        if (a === 0) return null
        return calcVariacao(a, 0)
      }
      return calcVariacao(row[campo], ant[campo])
    }

    const comparativoResumoBlocos = computed(() => {
      if (!comparacaoDisponivel.value) return []
      const r = resumo.value
      const a = resumoAnterior.value
      const mk = (key, label, campo) => ({
        key,
        label,
        actual: r[campo] ?? 0,
        anterior: a[campo] ?? 0,
        variacao: calcVariacao(r[campo], a[campo]),
      })
      return [
        mk('leads', 'Leads angariados', 'total_angariados'),
        mk('conv', 'Convertidos', 'total_convertidos'),
        mk('pts', 'Pontos', 'total_pontos'),
        mk('taxa', 'Taxa conversão (%)', 'taxa_conversao_global'),
      ]
    })

    const resultadosComparacao = computed(() => {
      if (!comparacaoDisponivel.value) return []
      const prevMap = mapaResultadosAnterior.value
      const ids = new Set([
        ...resultados.value.map((r) => r.angariador_id),
        ...resultadosAnterior.value.map((r) => r.angariador_id),
      ])
      const linhas = [...ids].map((id) => {
        const atual =
          resultados.value.find((r) => r.angariador_id === id) ||
          resultadosAnterior.value.find((r) => r.angariador_id === id)
        const anterior = prevMap.get(id) || {
          total_angariados: 0,
          total_convertidos: 0,
          total_pontos: 0,
          taxa_conversao: 0,
        }
        const row = resultados.value.find((r) => r.angariador_id === id) || {
          angariador_id: id,
          nome: atual?.nome || `ID ${id}`,
          total_angariados: 0,
          total_convertidos: 0,
          total_pontos: 0,
          taxa_conversao: 0,
        }
        return {
          ...row,
          anterior,
          variacao: {
            leads: calcVariacao(row.total_angariados, anterior.total_angariados),
            convertidos: calcVariacao(row.total_convertidos, anterior.total_convertidos),
            pontos: calcVariacao(row.total_pontos, anterior.total_pontos),
            taxa: calcVariacao(row.taxa_conversao, anterior.taxa_conversao),
          },
        }
      })
      return linhas.sort((x, y) => {
        if (y.total_pontos !== x.total_pontos) return y.total_pontos - x.total_pontos
        return y.total_convertidos - x.total_convertidos
      })
    })

    const resultadosOrdenados = computed(() => {
      return [...resultados.value].sort((a, b) => {
        if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos
        return b.total_convertidos - a.total_convertidos
      })
    })

    /** Top 3 angariadores na secção performance (sem repetir o mesmo nome/ID). */
    const resultadosPerformance = computed(() => {
      return resultadosOrdenados.value.slice(0, MAX_CARTOES_PERFORMANCE)
    })

    const metasAngariadores = computed(() => metasPacotes.value.angariadores || [])

    function classeChipMeta(actual, meta) {
      const a = Number(actual) || 0
      const m = Number(meta) || 0
      if (m <= 0) return 'meta-chip--muted'
      const ratio = a / m
      if (ratio >= 1) return 'meta-chip--ok'
      if (ratio >= 0.5) return 'meta-chip--warn'
      return 'meta-chip--bad'
    }

    const maxAngariados = computed(() => {
      const vals = resultados.value.map((r) => r.total_angariados || 0)
      return Math.max(...vals, 1)
    })

    const tituloPeriodoGrafico = computed(() => {
      if (periodo.value === 'dia') return 'dia'
      if (periodo.value === 'semana') return 'semana'
      return 'mês'
    })

    const chartInstanceKey = computed(() => {
      return (mixPacotes.value.angariadores || [])
        .map((a) => `${a.angariador_id}:${labelAngariadorGrafico(a)}`)
        .join('|')
    })

    const chartMostrar = computed(() => {
      return (mixPacotes.value.angariadores || []).length > 0
    })

    const chartTemDados = computed(() => {
      const angs = mixPacotes.value.angariadores || []
      return angs.some((a) => (a.valores || []).some((v) => v > 0))
    })

    const chartData = computed(() => {
      const mix = mixPacotes.value
      const labels = mix.pacotes?.length ? mix.pacotes : PACOTES_LABELS_FALLBACK
      const angs = mix.angariadores || []
      const usedLabels = new Set()
      return {
        labels,
        datasets: angs.map((ang, i) => {
          let legenda = labelAngariadorGrafico(ang)
          if (usedLabels.has(legenda)) {
            legenda = `${legenda} ·${i + 1}`
          }
          usedLabels.add(legenda)
          return {
            label: legenda.length > 22 ? `${legenda.slice(0, 20)}…` : legenda,
            data: labels.map((_, idx) => (ang.valores || [])[idx] ?? 0),
            backgroundColor: CHART_CORES_ANGARIADOR[i % CHART_CORES_ANGARIADOR.length],
            borderRadius: 6,
            maxBarThickness: 40,
          }
        }),
      }
    })

    const chartPacotesGeraisTotais = computed(() => {
      const labels = pacotesGeral.value.pacotes?.length
        ? pacotesGeral.value.pacotes
        : PACOTES_LABELS_FALLBACK
      if (Array.isArray(pacotesGeral.value.totais) && pacotesGeral.value.totais.length) {
        return labels.map((_, idx) => Number(pacotesGeral.value.totais[idx] || 0))
      }
      const fallback = labels.map(() => 0)
      ;(mixPacotes.value.angariadores || []).forEach((ang) => {
        labels.forEach((_, idx) => {
          fallback[idx] += Number((ang.valores || [])[idx] || 0)
        })
      })
      return fallback
    })

    const chartPacotesGeraisTemDados = computed(() => {
      return chartPacotesGeraisTotais.value.some((v) => v > 0)
    })

    const chartPacotesGeraisData = computed(() => {
      const labels = pacotesGeral.value.pacotes?.length
        ? pacotesGeral.value.pacotes
        : PACOTES_LABELS_FALLBACK
      return {
        labels,
        datasets: [
          {
            label: 'Total vendido',
            data: chartPacotesGeraisTotais.value,
            backgroundColor: 'rgba(25, 118, 210, 0.82)',
            borderRadius: 6,
            maxBarThickness: 42,
          },
        ],
      }
    })

    const chartPacotesGeraisOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: { boxWidth: 14, padding: 16 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    }

    const metasPeriodo = computed(() => {
      return METAS_POR_PERIODO[periodo.value] || METAS_POR_PERIODO.mes
    })

    const rotuloMetaPeriodo = computed(() => {
      if (periodo.value === 'dia') return 'diária'
      if (periodo.value === 'semana') return 'semanal'
      return 'mensal'
    })

    const formatReceitaEstimada = (pontos) => {
      const mzn = (pontos || 0) * 50
      if (mzn >= 1000) return `${(mzn / 1000).toFixed(1)}K`
      return String(mzn)
    }

    const kpisTopo = computed(() => {
      const r = resumo.value
      const ra = resumoAnterior.value
      const cmp = comparacaoDisponivel.value
      const taxa = r.taxa_conversao_global ?? 0
      const exp = r.pending_expirados ?? 0
      const ang = r.total_angariados ?? 0
      const pctExp = ang > 0 ? ((exp / ang) * 100).toFixed(1) : '0'
      const pontos = r.total_pontos ?? 0
      const chamadasTotal = chamadasResumo.value.total || 0
      const chamadasTop = (chamadasResumo.value.por_angariador || [])[0]
      const chamadasHint = modoChamadas.value === 'por_angariador'
        ? (
            chamadasTop
              ? `${chamadasTop.nome}: ${chamadasTop.total} chamada(s) no período`
              : 'Sem chamadas no período'
          )
        : `${chamadasTotal} chamada(s) no período`
      const kpiCmp = (campo) => (cmp && ra ? calcVariacao(r[campo], ra[campo]) : null)
      return [
        {
          key: 'leads',
          label: 'Leads novos',
          value: ang,
          hint: `${r.total_angariadores ?? 0} angariador(es) no período`,
          hintClass: 'text-grey-7',
          valueClass: 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
          comparacao: kpiCmp('total_angariados'),
        },
        {
          key: 'conv',
          label: 'Total convertidos',
          value: r.total_convertidos ?? 0,
          hint: `${taxa}% taxa global`,
          hintClass: taxa >= 30 ? 'text-positive' : 'text-warning',
          valueClass: 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
          comparacao: kpiCmp('total_convertidos'),
        },
        {
          key: 'receita',
          label: 'Receita estimada',
          value: formatReceitaEstimada(pontos),
          hint: 'MZN · via pontos (estimativa)',
          hintClass: 'text-grey-7',
          valueClass: 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
          comparacao: kpiCmp('total_pontos'),
        },
        {
          key: 'exp',
          label: 'Leads expirados',
          value: exp,
          hint: ang ? `${pctExp}% do total` : '—',
          hintClass: exp > 0 ? 'text-negative' : 'text-grey-7',
          valueClass: exp > 0 ? 'text-negative' : 'text-grey-9',
          colClass: 'col-sm-6 col-md-3',
          comparacao: kpiCmp('pending_expirados'),
        },
        {
          key: 'chamadas',
          label: 'Chamadas registadas',
          value: chamadasTotal,
          hint: chamadasHint,
          hintClass: chamadasTotal > 0 ? 'text-primary' : 'text-grey-7',
          valueClass: chamadasTotal > 0 ? 'text-primary' : 'text-grey-6',
          colClass: 'col-12 col-md-4',
          comparacao: null,
        },
      ]
    })

    const chamadasPorAngariador = computed(() => chamadasResumo.value.por_angariador || [])

    function getIntervaloPeriodoChamadas() {
      if (periodo.value === 'mes') {
        const inicio = new Date(ano.value, mes.value - 1, 1)
        const fim = new Date(ano.value, mes.value, 0, 23, 59, 59, 999)
        return { inicio, fim }
      }
      if (periodo.value === 'dia') {
        const d = fromYMD(dataDiaPicker.value)
        const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
        const fim = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
        return { inicio, fim }
      }
      const d = fromYMD(dataSemanaPicker.value)
      const s = startOfISOWeek(d)
      const e = endOfISOWeek(d)
      const inicio = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0)
      const fim = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999)
      return { inicio, fim }
    }

    function callInPeriodo(call, inicio, fim) {
      const d = new Date(call?.called_at)
      if (Number.isNaN(d.getTime())) return false
      return d >= inicio && d <= fim
    }

    async function carregarChamadasRegistadas() {
      try {
        const resp = await api.get('/users/list/', { params: { no_payments: 1 } })
        const users = Array.isArray(resp.data) ? resp.data : []
        const { inicio, fim } = getIntervaloPeriodoChamadas()
        const porAng = new Map()
        let total = 0

        users.forEach((u) => {
          const calls = Array.isArray(u.follow_up_calls) ? u.follow_up_calls : []
          calls.forEach((call) => {
            if (!callInPeriodo(call, inicio, fim)) return
            total += 1
            const nome = call.staff_name || `Staff #${call.staff_user || '—'}`
            porAng.set(nome, (porAng.get(nome) || 0) + 1)
          })
        })

        const ordenado = [...porAng.entries()]
          .map(([nome, totalCalls]) => ({ nome, total: totalCalls }))
          .sort((a, b) => b.total - a.total)

        chamadasResumo.value = { total, por_angariador: ordenado }
      } catch {
        chamadasResumo.value = { total: 0, por_angariador: [] }
      }
    }

    const alertaGlobalPlataforma = computed(() => {
      const taxaGlobal = resumo.value.taxa_conversao_global ?? 0
      const ang = resumo.value.total_angariados ?? 0
      const pend = resumo.value.pending_activos ?? 0
      const conv = resumo.value.total_convertidos ?? 0
      if (taxaGlobal < 25 && ang >= 5) {
        return `taxa global de conversão baixa (${taxaGlobal}%) no período.`
      }
      if (pend > conv * 2 && conv > 0) {
        return 'há muitos pending activos face aos convertidos na plataforma.'
      }
      return ''
    })

    function pctMetaConversao(row) {
      const metaConv = metasPeriodo.value.conv
      if (!metaConv) return 0
      return Math.round(((row.total_convertidos || 0) / metaConv) * 100)
    }

    /** Uma única mensagem de atenção por angariador (só quando há algo a rever). */
    function alertaAngariador(row) {
      const pct = pctMetaConversao(row)
      if (
        (row.total_angariados || 0) >= 3 &&
        pct < 50 &&
        (row.taxa_conversao || 0) < 40
      ) {
        return `A ${pct}% da meta ${rotuloMetaPeriodo.value} de conversão.`
      }
      if ((row.pending_expirados || 0) >= 5) {
        return `${row.pending_expirados} leads expirados — rever follow-up.`
      }
      if ((row.pending_activos || 0) >= 5) {
        return `${row.pending_activos} pending activos — priorizar contacto.`
      }
      if (
        (row.total_angariados || 0) >= 2 &&
        etiquetaDesempenho(row) === 'Abaixo meta'
      ) {
        return `Taxa ${row.taxa_conversao}% — abaixo da meta do período.`
      }
      return ''
    }

    function textoBannerAngariador(row) {
      const alerta = alertaAngariador(row)
      if (alerta) return alerta
      return `Taxa ${row.taxa_conversao}% · ${row.total_convertidos} convertidos · ${row.total_angariados} leads angariados.`
    }

    function topPacotesAngariador(row) {
      const pacotes = mixPacotes.value?.pacotes || []
      const angs = mixPacotes.value?.angariadores || []
      const rowKey = String(row?.angariador_id ?? row?.id ?? '')
      const match = angs.find((a) => String(a?.angariador_id ?? a?.id ?? '') === rowKey)
      if (!match || !Array.isArray(match.valores)) return []
      return pacotes
        .map((nome, idx) => ({ nome, total: Number(match.valores[idx] || 0) }))
        .filter((p) => p.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
    }

    const snapshotsPlataforma = computed(() => {
      const tp = totaisPlataforma.value
      const mk = (bloco, title, cardClass) => {
        if (!bloco) {
          return { title, leads: '—', convertidos: 0, taxa: 0, taxaColor: 'grey-6', rotulo: '', cardClass }
        }
        const taxa = bloco.taxa_conversao ?? 0
        return {
          title,
          leads: bloco.total_angariados ?? 0,
          convertidos: bloco.total_convertidos ?? 0,
          taxa,
          taxaColor: corTaxa(taxa),
          rotulo: bloco.rotulo || '',
          cardClass,
        }
      }
      return [
        { key: 'hoje', ...mk(tp.hoje, 'Hoje', 'stats-snap-card--primary') },
        { key: 'sem', ...mk(tp.semana_actual, 'Semana actual (ISO)', 'stats-snap-card--secondary') },
        { key: 'mes', ...mk(tp.mes_actual, 'Mês corrente', 'stats-snap-card--accent') },
      ]
    })

    function corTaxa(taxa) {
      if (taxa >= 50) return 'positive'
      if (taxa >= 20) return 'warning'
      return 'negative'
    }

    function avatarCor(idx) {
      return AVATAR_CORES[idx % AVATAR_CORES.length]
    }

    function avatarCorReferencia(idx) {
      return AVATAR_CORES_REF[idx % AVATAR_CORES_REF.length]
    }

    function progressoMeta(actual, meta) {
      if (!meta) return 0
      return Math.min((actual || 0) / meta, 1)
    }

    function corBarraMeta(actual, meta) {
      const p = progressoMeta(actual, meta)
      if (p >= 1) return 'positive'
      if (p >= 0.5) return 'warning'
      return 'negative'
    }

    function classeCartaoAngariador(row) {
      const classes = []
      if (etiquetaDesempenho(row) === 'Destaque') {
        classes.push('stats-person-card--highlight')
      }
      if (etiquetaDesempenho(row) === 'Abaixo meta') {
        classes.push('stats-person-card--at-risk')
      }
      return classes
    }

    function etiquetaDesempenho(row) {
      const convMeta = progressoMeta(
        row.total_convertidos,
        metasPeriodo.value.conv
      )
      if (row.taxa_conversao >= 55 || convMeta >= 1) return 'Destaque'
      if (row.taxa_conversao >= 40 || convMeta >= 0.5) return 'Na meta'
      if (row.total_angariados < 2) return 'Pouco volume'
      return 'Abaixo meta'
    }

    const filtrarAngariadores = (val, update) => {
      const termo = (val || '').trim()
      q.value = termo
      angariadorSeleccionado.value = null
      if (termo.length < 2) {
        update(() => {
          angariadorOptions.value = []
        })
        return
      }
      angariadorSearchLoading.value = true
      api
        .get('/angariadores/admin/search/', { params: { q: termo } })
        .then((resp) => {
          const lista = Array.isArray(resp.data) ? resp.data : []
          update(() => {
            angariadorOptions.value = lista
          })
        })
        .catch(() => {
          update(() => {
            angariadorOptions.value = []
          })
        })
        .finally(() => {
          angariadorSearchLoading.value = false
        })
    }

    const onAngariadorSeleccionado = (opt) => {
      if (!opt) return
      q.value = opt.label || ''
      carregar()
    }

    const onAngariadorLimpo = () => {
      angariadorSeleccionado.value = null
      q.value = ''
      angariadorOptions.value = []
    }

    function buildQueryParamsBase() {
      return {
        periodo: periodo.value,
        q: angariadorSeleccionado.value ? undefined : (q.value || undefined),
        angariador_id: angariadorSeleccionado.value?.id || undefined,
      }
    }

    function buildQueryParams() {
      const base = buildQueryParamsBase()
      if (periodo.value === 'mes') {
        return { ...base, mes: mes.value, ano: ano.value }
      }
      if (periodo.value === 'dia') {
        return { ...base, data: dataDiaPicker.value }
      }
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return base
      const inicio = startOfISOWeek(d)
      const fim = endOfISOWeek(d)
      return {
        ...base,
        semana: getISOWeek(d),
        ano: getISOWeekYear(d),
        data_inicio: format(inicio, 'yyyy-MM-dd'),
        data_fim: format(fim, 'yyyy-MM-dd'),
      }
    }

    function buildQueryParamsAnterior() {
      const base = buildQueryParamsBase()
      if (periodo.value === 'mes') {
        let m = mes.value - 1
        let y = ano.value
        if (m < 1) {
          m = 12
          y -= 1
        }
        return { ...base, mes: m, ano: y }
      }
      if (periodo.value === 'dia') {
        const d = fromYMD(dataDiaPicker.value)
        if (Number.isNaN(d.getTime())) return { ...base, data: dataDiaPicker.value }
        return { ...base, data: format(subDays(d, 1), 'yyyy-MM-dd') }
      }
      const d = fromYMD(dataSemanaPicker.value)
      if (Number.isNaN(d.getTime())) return base
      const prev = subDays(d, 7)
      const inicio = startOfISOWeek(prev)
      const fim = endOfISOWeek(prev)
      return {
        ...base,
        semana: getISOWeek(prev),
        ano: getISOWeekYear(prev),
        data_inicio: format(inicio, 'yyyy-MM-dd'),
        data_fim: format(fim, 'yyyy-MM-dd'),
      }
    }

    function nomeFicheiroCsv() {
      if (periodo.value === 'mes') {
        return `angariadores-stats-${ano.value}-${String(mes.value).padStart(2, '0')}.csv`
      }
      if (periodo.value === 'dia') {
        return `angariadores-stats-dia-${dataDiaPicker.value}.csv`
      }
      const d = fromYMD(dataSemanaPicker.value)
      if (!Number.isNaN(d.getTime())) {
        const w = getISOWeek(d)
        const yIso = getISOWeekYear(d)
        return `angariadores-stats-semana-${yIso}-W${String(w).padStart(2, '0')}.csv`
      }
      return 'angariadores-stats.csv'
    }

    const carregar = async () => {
      loading.value = true
      resultadoStatsOk.value = false
      try {
        const requests = [
          api.get('/angariadores/admin/stats/', { params: buildQueryParams() }),
        ]
        if (compararPeriodo.value) {
          requests.push(
            api.get('/angariadores/admin/stats/', { params: buildQueryParamsAnterior() })
          )
        }
        const [resp, respAnt] = await Promise.all(requests)
        const body = resp.data || {}
        resumo.value = body.resumo || {}
        const tp = body.totais_plataforma || body.totaisPlataforma || {}
        totaisPlataforma.value = typeof tp === 'object' && tp !== null ? { ...tp } : {}
        const deduped = deduplicarResultados(body.resultados || [])
        const sorted = ordenarResultados(deduped)
        resultados.value = sorted
        mixPacotes.value = enriquecerMixPacotes(
          body.mix_pacotes || body.mixPacotes,
          sorted
        )
        const pg = body.pacotes_geral || body.pacotesGeral || {}
        pacotesGeral.value = {
          pacotes: pg.pacotes || PACOTES_LABELS_FALLBACK,
          totais: pg.totais || [],
          total_pagamentos: pg.total_pagamentos || 0,
          total_via_angariacao: pg.total_via_angariacao || 0,
          total_pagamentos_normais: pg.total_pagamentos_normais || 0,
        }
        metasPacotes.value = enriquecerMetasPacotes(
          body.metas_pacotes || body.metasPacotes,
          sorted
        )
        if (compararPeriodo.value && respAnt) {
          const bodyAnt = respAnt.data || {}
          resumoAnterior.value = bodyAnt.resumo || {}
          resultadosAnterior.value = deduplicarResultados(bodyAnt.resultados || [])
          comparacaoCarregada.value = true
        } else {
          comparacaoCarregada.value = false
          resumoAnterior.value = null
          resultadosAnterior.value = []
        }
        await carregarChamadasRegistadas()
        mesNome.value = body.mes_nome || ''
        resultadoStatsOk.value = true
      } catch (err) {
        comparacaoCarregada.value = false
        $q.notify({
          type: 'negative',
          message: err.response?.data?.error || 'Erro ao carregar estatísticas de angariadores',
        })
      } finally {
        loading.value = false
      }
    }

    const csvEscape = (value) => {
      if (value === null || value === undefined) return ''
      const text = String(value).replace(/"/g, '""')
      return `"${text}"`
    }

    const exportarCsv = () => {
      if (!resultados.value.length) return

      const header = [
        'angariador_id',
        'nome',
        'username',
        'telefone',
        'mes',
        'ano',
        'mes_nome',
        'total_angariados',
        'total_convertidos',
        'pending_activos',
        'pending_expirados',
        'convertidos_fora_15m',
        'convertidos_via_painel',
        'total_pontos',
        'taxa_conversao',
      ]

      const lines = []
      lines.push(['Resumo', '', '', '', '', '', '', '', '', '', '', '', ''].map(csvEscape).join(','))
      lines.push(['total_angariadores', resumo.value.total_angariadores || 0].map(csvEscape).join(','))
      lines.push(['total_angariados', resumo.value.total_angariados || 0].map(csvEscape).join(','))
      lines.push(['total_convertidos', resumo.value.total_convertidos || 0].map(csvEscape).join(','))
      lines.push(['total_pontos', resumo.value.total_pontos || 0].map(csvEscape).join(','))
      lines.push(['pending_activos', resumo.value.pending_activos || 0].map(csvEscape).join(','))
      lines.push(['pending_expirados', resumo.value.pending_expirados || 0].map(csvEscape).join(','))
      lines.push(['taxa_conversao_global', resumo.value.taxa_conversao_global || 0].map(csvEscape).join(','))
      lines.push('')
      lines.push(header.map(csvEscape).join(','))

      resultados.value.forEach((row) => {
        lines.push(
          [
            row.angariador_id,
            row.nome,
            row.username,
            row.telefone,
            row.mes,
            row.ano,
            row.mes_nome,
            row.total_angariados,
            row.total_convertidos,
            row.pending_activos,
            row.pending_expirados,
            row.convertidos_fora_15m ?? 0,
            row.convertidos_via_painel ?? 0,
            row.total_pontos,
            row.taxa_conversao,
          ]
            .map(csvEscape)
            .join(',')
        )
      })

      const csvContent = '\uFEFF' + lines.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nomeFicheiroCsv()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    watch(periodo, () => {
      carregar()
    })

    watch([mes, ano, dataDiaPicker, dataSemanaPicker], () => {
      if (!loading.value) carregar()
    })

    onMounted(carregar)

    return {
      periodo,
      compararPeriodo,
      tituloPeriodoAnterior,
      comparacaoDisponivel,
      comparativoResumoBlocos,
      resultadosComparacao,
      variacaoAngariador,
      mes,
      ano,
      dataDiaPicker,
      dataSemanaPicker,
      dataDiaDisplay,
      dataSemanaDisplay,
      intervaloSemanaHint,
      tituloResultados,
      angariadorSeleccionado,
      angariadorOptions,
      angariadorSearchLoading,
      filtrarAngariadores,
      onAngariadorSeleccionado,
      onAngariadorLimpo,
      loading,
      avisoTotaisPlataforma,
      resumo,
      totaisPlataforma,
      textoReferenciaTemporal,
      intervaloSemanaPlataforma,
      resultados,
      resultadosOrdenados,
      resultadosPerformance,
      chaveAngariador,
      textoBannerAngariador,
      maxAngariados,
      mixPacotes,
      pacotesGeral,
      metasPacotes,
      metasAngariadores,
      metasMensaisVisivel,
      modoChamadas,
      chamadasResumo,
      chamadasPorAngariador,
      classeChipMeta,
      tituloPeriodoGrafico,
      chartInstanceKey,
      chartMostrar,
      chartTemDados,
      chartPacotesGeraisTemDados,
      chartPacotesGeraisData,
      chartPacotesGeraisOptions,
      chartData,
      chartOptions,
      labelAngariadorGrafico,
      kpisTopo,
      metasPeriodo,
      rotuloMetaPeriodo,
      alertaGlobalPlataforma,
      alertaAngariador,
      topPacotesAngariador,
      snapshotsPlataforma,
      iniciais,
      corTaxa,
      avatarCor,
      avatarCorReferencia,
      progressoMeta,
      corBarraMeta,
      classeCartaoAngariador,
      etiquetaDesempenho,
      mesNome,
      carregar,
      exportarCsv,
    }
  },
}
</script>

<style lang="scss" scoped>
.ang-stats-page {
  background: #f5f5f5;
  min-height: 100%;
}

.section-label {
  letter-spacing: 0.04em;
}

.stats-panel-card {
  background: #fff;
  border-radius: 12px;
  border-color: rgba(0, 0, 0, 0.08);
}

.stats-filters-sticky {
  position: sticky;
  top: 72px;
  z-index: 20;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.stats-compare-card {
  border-left: 4px solid var(--q-primary);
}

.stats-compare-metric {
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  height: 100%;
}

.stats-compare-table {
  th {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #616161;
  }
  td {
    vertical-align: top;
    padding-top: 10px;
    padding-bottom: 10px;
  }
}

.stats-alert-banner {
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #5d4037;
}

.stats-alert-line {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  background: #faf6f0;
  border: 1px solid #e8dcc8;
  border-radius: 10px;
  color: #5d4037;

  &--ok {
    background: #f1f8e9;
    border-color: #c8e6c9;
    color: #33691e;
  }
}

.stats-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #616161;
}

.stats-kpi-card {
  background: #fff;
  border-radius: 12px;
  border-color: rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.12);
  }

  &--compact .stats-kpi-label {
    letter-spacing: 0.06em;
  }
}

.stats-snap-card {
  background: #fff;
  border-radius: 12px;
  height: 100%;
  border-left: 4px solid #bdbdbd;

  &--primary {
    border-left-color: #1976d2;
  }

  &--secondary {
    border-left-color: #26a69a;
  }

  &--accent {
    border-left-color: #9c27b0;
  }
}

.stats-chart-wrap {
  position: relative;
  height: 280px;
  width: 100%;

  &--mix {
    height: 320px;
  }
}

.stats-person-card {
  background: #fff;
  border-radius: 12px;
  height: 100%;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  &--highlight {
    border-color: #26a69a;
    box-shadow: 0 4px 14px rgba(38, 166, 154, 0.2);
  }

  &--at-risk {
    border-color: #ffb74d;
    box-shadow: 0 2px 10px rgba(255, 152, 0, 0.15);
  }
}

.stats-metric-list--ref .stats-metric-row {
  border-bottom: none;
  padding: 6px 0;
}

.stats-person-alert {
  display: flex;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: 8px;
  line-height: 1.35;

  &--warn {
    background: #fff8e1;
    border: 1px solid #ffe082;
    color: #5d4037;
  }

  &--ok {
    background: #f1f8e9;
    border: 1px solid #c8e6c9;
    color: #33691e;
  }

  &--muted {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    color: #616161;
  }
}

.stats-metric-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #616161;
  padding: 4px 0;
  border-bottom: 1px dashed #eeeeee;

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: #212121;
  }
}

.stats-table :deep(thead tr th) {
  background: #e8f5e9;
  color: #1b5e20;
  font-weight: 600;
}

.stats-table :deep(tbody tr:hover) {
  background: #f1f8e9;
}

.metas-pacote-table {
  border-radius: 8px;
  overflow: hidden;

  thead tr {
    background: #fafafa;
  }

  th,
  td {
    padding: 10px 12px;
    font-size: 0.875rem;
  }

  tbody tr:nth-child(even) {
    background: #fcfcfc;
  }
}

.meta-chip {
  display: inline-block;
  min-width: 52px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;

  &--ok {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--warn {
    background: #fff8e1;
    color: #f57c00;
  }

  &--bad {
    background: #ffebee;
    color: #c62828;
  }

  &--muted {
    background: #f5f5f5;
    color: #757575;
  }
}
</style>
