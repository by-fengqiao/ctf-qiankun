import { useState, useCallback, useEffect, useRef } from 'react';
import {
  smartDecode, executeEncodeChain, verifyRoundTrip,
  loadExpected, saveExpected, truncateInput,
  recommendChain, type ExpectedMatch,
} from '@/lib/smart-codec-utils';
import { CODEC_MAP, type EncodeLayer, type DecodeCandidate } from '@/lib/codecs';

export type CodecDirection = 'decode' | 'encode';

export interface RoundTripResult {
  verified: boolean;
  decoded: string;
  failedLayer?: number;
}

export function useSmartCodec() {
  const [direction, setDirection] = useState<CodecDirection>('decode');
  const [input, setInput] = useState('');
  const [output, setInput_output] = useState('');
  const [candidates, setCandidates] = useState<DecodeCandidate[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [usedBruteForce, setUsedBruteForce] = useState(false);
  const [encodeChain, setEncodeChain] = useState<EncodeLayer[]>([]);
  const [encodePreviews, setEncodePreviews] = useState<{ layer: number; codecName: string; param: string; result: string }[]>([]);
  const [encodeError, setEncodeError] = useState<string | undefined>();
  const [roundTrip, setRoundTrip] = useState<RoundTripResult | null>(null);
  const [expected, setExpected] = useState<ExpectedMatch>(loadExpected);
  const [truncated, setTruncated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { saveExpected(expected); }, [expected]);

  const doDecode = useCallback((text: string) => {
    if (!text.trim()) { setCandidates([]); setUsedBruteForce(false); setIsDecoding(false); return; }
    setIsDecoding(true);
    const { truncated: trunc, text: clean } = truncateInput(text);
    setTruncated(trunc);
    const { candidates: cands, usedBruteForce: ubf } = smartDecode(clean, expected);
    setCandidates(cands);
    setUsedBruteForce(ubf);
    setIsDecoding(false);
  }, [expected]);

  useEffect(() => {
    if (direction !== 'decode') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doDecode(input), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, direction, doDecode]);

  const doEncode = useCallback(() => {
    if (encodeChain.length === 0) { setInput_output(''); setEncodePreviews([]); setEncodeError(undefined); setRoundTrip(null); return; }
    const { truncated: trunc, text: clean } = truncateInput(input);
    setTruncated(trunc);
    const { output, previews, error } = executeEncodeChain(clean, encodeChain);
    setInput_output(output);
    setEncodePreviews(previews);
    setEncodeError(error);
    if (!error && clean) {
      const result = verifyRoundTrip(clean, output, encodeChain);
      setRoundTrip(result);
    } else {
      setRoundTrip(null);
    }
  }, [input, encodeChain]);

  useEffect(() => { doEncode(); }, [encodeChain, doEncode]);

  const switchDirection = useCallback(() => {
    setDirection((prev) => {
      const next = prev === 'decode' ? 'encode' : 'decode';
      setInput(output);
      setInput_output(input);
      setCandidates([]);
      setEncodePreviews([]);
      setEncodeError(undefined);
      setRoundTrip(null);
      return next;
    });
  }, [input, output]);

  const addEncodeLayer = useCallback((codecName: string) => {
    if (encodeChain.length >= 10) return;
    const codec = CODEC_MAP[codecName];
    if (!codec || codec.decodeOnly) return;
    setEncodeChain((prev) => [...prev, { codecName, param: codec.param?.default ?? '' }]);
  }, [encodeChain.length]);

  const removeEncodeLayer = useCallback((index: number) => {
    setEncodeChain((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateEncodeLayer = useCallback((index: number, updates: Partial<EncodeLayer>) => {
    setEncodeChain((prev) => prev.map((l, i) => i === index ? { ...l, ...updates } : l));
  }, []);

  const moveEncodeLayer = useCallback((from: number, to: number) => {
    setEncodeChain((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const arr = [...prev];
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return arr;
    });
  }, []);

  const applyPreset = useCallback((chain: EncodeLayer[]) => {
    setEncodeChain(chain);
  }, []);

  const applyRecommendation = useCallback((plaintext: string, unreadability: number) => {
    setEncodeChain(recommendChain(plaintext, unreadability));
  }, []);

  const clearAll = useCallback(() => {
    setInput('');
    setInput_output('');
    setCandidates([]);
    setEncodePreviews([]);
    setEncodeError(undefined);
    setRoundTrip(null);
    setUsedBruteForce(false);
  }, []);

  return {
    direction, setDirection, switchDirection,
    input, setInput, output, setOutput: setInput_output,
    candidates, isDecoding, usedBruteForce,
    encodeChain, addEncodeLayer, removeEncodeLayer, updateEncodeLayer, moveEncodeLayer,
    encodePreviews, encodeError, roundTrip,
    expected, setExpected,
    truncated, clearAll, applyPreset, applyRecommendation,
    doDecode, doEncode,
  };
}
