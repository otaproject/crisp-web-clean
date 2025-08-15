import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock } from "lucide-react";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import ShiftPlanningForm from "@/components/events/ShiftPlanningForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
const EventDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const event = useAppStore(s => s.getEventById(id!));
  const clients = useAppStore(s => s.clients);
  const brands = useAppStore(s => s.brands);
  const operators = useAppStore(s => s.operators);
  const createShift = useAppStore(s => s.createShift);
  const assignOperators = useAppStore(s => s.assignOperators);
  const setOperatorSlot = useAppStore(s => s.setOperatorSlot);
  const removeOperator = useAppStore(s => s.removeOperator);
  const updateEventAddress = useAppStore(s => s.updateEventAddress);
  const updateEventActivityCode = useAppStore(s => s.updateEventActivityCode);
  const setTeamLeader = useAppStore(s => s.setTeamLeader);
  const updateShiftNotes = useAppStore(s => s.updateShiftNotes);
  const updateShiftTime = useAppStore(s => s.updateShiftTime);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const deleteShift = useAppStore(s => s.deleteShift);
  const addSlotToShift = useAppStore(s => s.addSlotToShift);
  
  // State for individual row time editing - each row has its own independent times
  const [rowTimes, setRowTimes] = useState<{[key: string]: {startTime: string, endTime: string}}>({});
  const [editingTimes, setEditingTimes] = useState<string | null>(null);
  const shifts = useAppStore(s => s.getShiftsByEvent(id!));
  const clientName = useMemo(() => clients.find(c => c.id === event?.clientId)?.name, [clients, event]);
  const brandName = useMemo(() => brands.find(b => b.id === event?.brandId)?.name, [brands, event]);
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(event?.address || "");
  const [activityCode, setActivityCode] = useState(event?.activityCode || "");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  
  if (!event) return <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>;

  const handleShiftSubmit = (values: any) => {
    const d = `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, "0")}-${String(values.date.getDate()).padStart(2, "0")}`;
    
    // Crea array di slot vuoti per il numero di operatori specificato
    const operatorIds = Array(values.numOperators).fill("");
    
    createShift({
      eventId: event.id,
      date: d,
      startTime: values.startTime,
      endTime: values.endTime,
      operatorIds: operatorIds,
      activityType: values.activityType as ActivityType,
      requiredOperators: values.numOperators,
      notes: values.notes || undefined
    });
  };

  const onAssign = (selectedIds: string[]) => {
    if (currentShift && currentSlotIndex !== null) {
      // Se selectedIds è vuoto o contiene stringa vuota, significa "Non assegnato"
      if (selectedIds.length === 0 || selectedIds[0] === "") {
        setOperatorSlot(currentShift, currentSlotIndex, "");
      } else {
        setOperatorSlot(currentShift, currentSlotIndex, selectedIds[0]);
      }
    }
    setAssignOpen(false);
    setCurrentShift(null);
    setCurrentSlotIndex(null);
  };
  const handleSaveAddress = () => {
    updateEventAddress(event.id, tempAddress);
    setEditingAddress(false);
  };
  const handleCancelEditAddress = () => {
    setTempAddress(event?.address || "");
    setEditingAddress(false);
  };
  const getOperatorName = (id: string) => operators.find(o => o.id === id)?.name || id;
  const handleSaveNotes = (shiftId: string) => {
    updateShiftNotes(shiftId, tempNotes);
    setEditingNotes(null);
  };
  const handleCancelEditNotes = () => {
    setTempNotes("");
    setEditingNotes(null);
  };
  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      // Remove team leader
      setTeamLeader(shiftId, "");
    } else {
      // Set as team leader
      setTeamLeader(shiftId, operatorId);
    }
  };

  // Ordinamento tabella turni
  const [sort, setSort] = useState<{ key: 'date' | 'startTime' | 'endTime'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
  const toggleSort = (key: 'date' | 'startTime' | 'endTime') =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const sortedShifts = useMemo(() => {
    const arr = [...shifts];
    arr.sort((a, b) => {
      let va = '', vb = '';
      if (sort.key === 'date') { va = a.date; vb = b.date; }
      if (sort.key === 'startTime') { va = a.startTime; vb = b.startTime; }
      if (sort.key === 'endTime') { va = a.endTime; vb = b.endTime; }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [shifts, sort]);

  // Calcola la copertura di un turno
  const calculateShiftCoverage = (shift: any) => {
    const shiftStartTime = new Date(`2000-01-01T${shift.startTime}`);
    const shiftEndTime = new Date(`2000-01-01T${shift.endTime}`);
    const shiftMinutes = (shiftEndTime.getTime() - shiftStartTime.getTime()) / (1000 * 60);
    
    const assignedSlots = shift.operatorIds.filter((id: string) => id && id.trim() !== "");
    const uncoveredMinutes = Math.max(0, shiftMinutes * (shift.requiredOperators - assignedSlots.length));
    
    return {
      isCovered: uncoveredMinutes === 0,
      uncoveredMinutes
    };
  };

  const formatUncoveredTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return <main className="container py-8">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Event info at top left, dashboards side by side */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <h1 className="font-semibold mb-2 text-4xl">{event.title}</h1>
          
          {/* Counters under title */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-accent/20 rounded-lg p-4 border border-accent/40">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Totale operatori assegnati</p>
                  <p className="text-xl font-semibold text-primary">
                    {shifts.reduce((total, shift) => {
                      return total + shift.operatorIds.filter(id => id && id.trim() !== "").length;
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/20 rounded-lg p-4 border border-accent/40">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Totale ore assegnate</p>
                  <p className="text-xl font-semibold text-primary">
                    {shifts.reduce((total, shift) => {
                      const assignedOperators = shift.operatorIds.filter(id => id && id.trim() !== "").length;
                      const startTime = new Date(`2000-01-01T${shift.startTime}`);
                      const endTime = new Date(`2000-01-01T${shift.endTime}`);
                      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                      return total + (hours * assignedOperators);
                    }, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/20 rounded-lg p-4 border border-accent/40">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Totale ore evento</p>
                  <p className="text-xl font-semibold text-primary">
                    {shifts.reduce((total, shift) => {
                      const startTime = new Date(`2000-01-01T${shift.startTime}`);
                      const endTime = new Date(`2000-01-01T${shift.endTime}`);
                      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                      return total + (hours * shift.requiredOperators);
                    }, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <span className="text-muted-foreground">Codice attività:</span>
            <Input 
              placeholder="Inserisci codice attività" 
              className="w-32" 
              value={activityCode}
              onChange={(e) => {
                setActivityCode(e.target.value);
                updateEventActivityCode(event.id, e.target.value);
              }}
            />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <ShiftPlanningForm onSubmit={handleShiftSubmit} />
        </div>
      </section>


      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-2xl">LISTA TURNI EVENTO</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {event.startDate && event.endDate ? (
                  `dal ${event.startDate.split("-").reverse().join("/")} al ${event.endDate.split("-").reverse().join("/")}`
                ) : (
                  "Date evento non specificate"
                )}
              </span>
              <div className="flex items-center gap-2">
                {editingAddress ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={tempAddress} 
                      onChange={e => setTempAddress(e.target.value)} 
                      className="max-w-md h-8" 
                      placeholder="Inserisci indirizzo evento" 
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveAddress}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEditAddress}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{event.address || "Indirizzo non specificato"}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingAddress(true)} aria-label="Modifica indirizzo">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {sortedShifts.map(shift => {
            const coverage = calculateShiftCoverage(shift);
            
            return (
              <div key={shift.id} className="rounded-lg border border-border overflow-hidden bg-background">
                {/* Intestazione turno */}
                <div className="bg-muted/50 p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-medium text-lg">
                        Turno del {shift.date.split("-").reverse().join("/")} {shift.startTime} – {shift.endTime}
                      </h3>
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
                        {shift.activityType || "Non specificato"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {coverage.isCovered ? (
                        <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                          ✓ OK
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                            ⚠ {formatUncoveredTime(coverage.uncoveredMinutes)} scoperto
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addSlotToShift(shift.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Copri
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteShift(shift.id)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Elimina intero turno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tabella slot operatori */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ora Inizio</TableHead>
                      <TableHead>Ora Fine</TableHead>
                      <TableHead>Operatore</TableHead>
                      <TableHead>TL</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shift.operatorIds.map((operatorId, slotIndex) => {
                      const isAssigned = operatorId && operatorId.trim() !== "";
                      
                      return (
                        <TableRow 
                          key={`${shift.id}-slot-${slotIndex}`}
                          id={`turn-${shift.id}-${slotIndex}`}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => updateShiftTime(shift.id, { startTime: e.target.value })}
                              className="px-3 py-1 border border-input rounded text-sm bg-background"
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => updateShiftTime(shift.id, { endTime: e.target.value })}
                              className="px-3 py-1 border border-input rounded text-sm bg-background"
                            />
                          </TableCell>
                          <TableCell>
                            {isAssigned ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{getOperatorName(operatorId)}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    removeOperator(shift.id, operatorId);
                                  }}
                                  aria-label={`Rimuovi ${getOperatorName(operatorId)}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setCurrentShift(shift.id);
                                    setCurrentSlotIndex(slotIndex);
                                    setAssignOpen(true);
                                  }}
                                  aria-label={`Modifica operatore ${getOperatorName(operatorId)}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setCurrentShift(shift.id);
                                  setCurrentSlotIndex(slotIndex);
                                  setAssignOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                                Assegna
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAssigned ? (
                              <Checkbox
                                checked={shift.teamLeaderId === operatorId}
                                onCheckedChange={() => handleToggleTeamLeader(shift.id, operatorId, shift.teamLeaderId === operatorId)}
                                aria-label={shift.teamLeaderId === operatorId ? "Rimuovi come team leader" : "Imposta come team leader"}
                              />
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            {shift.notes && shift.notes.trim() !== "" ? (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setEditingNotes(shift.id);
                                  setTempNotes(shift.notes || "");
                                }}
                                aria-label="Visualizza/Modifica note"
                                title={shift.notes}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {/* Actions for individual slot removal will be handled in the operator column */}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
          
          {sortedShifts.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-lg">
              Nessun turno pianificato. Crea il primo turno.
            </div>
          )}
        </div>
      </section>

      {/* Dialog per modificare note */}
      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Note Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={tempNotes} onChange={e => setTempNotes(e.target.value)} placeholder="Inserisci note per il turno" rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEditNotes}>
                Annulla
              </Button>
              <Button onClick={() => editingNotes && handleSaveNotes(editingNotes)}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <OperatorAssignDialog open={assignOpen} onOpenChange={setAssignOpen} operators={currentShift ? operators.filter(op => !shifts.find(s => s.id === currentShift)?.operatorIds.includes(op.id)) : operators} onConfirm={onAssign} />
    </main>;
};
export default EventDetail;