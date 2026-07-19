import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { TAB_BAR_CLEARANCE } from '@/components/ui/tab-bar';
import { REPORT_CATEGORIES, type ReportCategory } from '@/features/reports/constants';
import { STATUS_CONFIG } from '@/features/reports/status';
import type { Report } from '@/features/reports/types';
import { useReports } from '@/features/reports/use-reports';

const FILTERS = ['Todos', ...REPORT_CATEGORIES] as const;

function ReportCard({ report }: { report: Report }) {
  return (
    <Card className="mb-4 gap-3 overflow-hidden">
      <View className="h-40 w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <Icon name="image-not-supported" size={28} color="#A3A3A3" />
      </View>
      <View className="gap-2 p-4 pt-0">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 text-lg font-semibold text-black dark:text-white">
            {report.titulo}
          </Text>
          <View className="ml-2 flex-row items-center gap-1">
            <Icon name="thumb-up" size={16} />
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{report.votos}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <StatusBadge {...STATUS_CONFIG[report.estado]} />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {report.categoria} • {report.fecha}
          </Text>
        </View>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
          {report.descripcion}
        </Text>
      </View>
    </Card>
  );
}

export default function MisReportesScreen() {
  const { data: reports = [] } = useReports();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos');

  const filtered =
    filter === 'Todos' ? reports : reports.filter((r) => r.categoria === (filter as ReportCategory));

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
      <View className="gap-4 px-5 pt-6">
        <Text className="text-3xl font-bold text-black dark:text-white">Mis Reportes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pb-2">
            {FILTERS.map((item) => (
              <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
            ))}
          </View>
        </ScrollView>
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReportCard report={item} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: TAB_BAR_CLEARANCE + 24,
        }}
        ListEmptyComponent={
          <View className="items-center justify-center pt-16">
            <Icon name="inbox" size={32} color="#A3A3A3" />
            <Text className="mt-3 text-center text-neutral-500 dark:text-neutral-400">
              Todavía no hay reportes en esta categoría.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
