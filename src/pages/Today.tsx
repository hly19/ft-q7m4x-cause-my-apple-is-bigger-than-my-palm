import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { BackupBanner, IosInstallHint } from '../components/Banners';
import { CustomFoodForm } from '../components/CustomFoodForm';
import { FoodList } from '../components/FoodList';
import { QuickAddGrid } from '../components/QuickAddGrid';
import { StepsInput } from '../components/StepsInput';
import { SummaryBar } from '../components/SummaryBar';
import { Button } from '../components/ui';
import { db } from '../db/db';
import { useDay } from '../hooks/useDay';
import { go } from '../hooks/useRoute';
import { useSettings } from '../hooks/useSettings';
import { useTotals } from '../hooks/useTotals';
import { addDays, dayLabel, today } from '../utils/dates';

export function Today({ date }: { date: string }) {
  const settings = useSettings();
  const { entries, day } = useDay(date);
  const totals = useTotals(entries);
  const hasData = useLiveQuery(async () => (await db.foodEntries.count()) > 0, []) ?? false;
  const [modal, setModal] = useState<'custom' | null>(null);
  const isToday = date === today();

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-1">
        <button className="min-h-11 min-w-11 text-2xl" aria-label="Previous day" onClick={() => go({ page: 'today', date: addDays(date, -1) })}>‹</button>
        <h1 className="flex-1 text-center text-xl font-semibold">{dayLabel(date)}</h1>
        {!isToday && (
          <button className="min-h-11 px-2 text-sm text-emerald-600" onClick={() => go({ page: 'today', date: today() })}>Today</button>
        )}
        <button className="min-h-11 min-w-11 text-2xl" aria-label="Next day" onClick={() => go({ page: 'today', date: addDays(date, 1) })}>›</button>
      </header>

      <IosInstallHint />
      <BackupBanner settings={settings} hasData={hasData} />

      <SummaryBar
        kcal={totals.kcal}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        steps={day?.steps ?? 0}
        kcalTarget={settings.kcalTarget}
        proteinTarget={settings.proteinTarget}
        carbsTarget={settings.carbsTarget}
        fatTarget={settings.fatTarget}
        stepTarget={settings.stepTarget}
      />

      <section>
        <QuickAddGrid date={date} />
        <Button variant="primary" className="w-full mt-2" onClick={() => setModal('custom')}>+ Custom</Button>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Food</h2>
        <FoodList entries={entries} />
      </section>

      <section className="space-y-2">
        <StepsInput key={`${date}:${day?.steps ?? ''}`} date={date} steps={day?.steps} />
      </section>

      {modal === 'custom' && <CustomFoodForm date={date} onClose={() => setModal(null)} />}
    </div>
  );
}
