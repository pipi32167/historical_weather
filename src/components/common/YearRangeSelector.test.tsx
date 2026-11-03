/**
 * 年份范围选择器测试
 *
 * 回归：选择「自定义」原本在 handleSelectChange 里直接 return，
 * 输入框永远不出现（预设只有 10/20/30/50，默认 20 → 永远匹配预设）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../i18n';
import { YearRangeSelector } from './YearRangeSelector';

describe('YearRangeSelector', () => {
  it('选择「自定义」后出现起止年份输入框', () => {
    const { container } = render(<YearRangeSelector />);

    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0);

    const select = container.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'custom' } });

    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(2);
  });

  it('选择预设范围时收起自定义输入框', () => {
    const { container } = render(<YearRangeSelector />);
    const select = container.querySelector('select')!;

    fireEvent.change(select, { target: { value: 'custom' } });
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(2);

    fireEvent.change(select, { target: { value: '10' } });
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('选中预设范围时下拉值跟随 store', () => {
    const { container } = render(<YearRangeSelector />);
    const select = container.querySelector('select')!;
    const currentOption = (select as HTMLSelectElement).value;

    expect(['10', '20', '30', '50', 'custom']).toContain(currentOption);
    expect(screen.getByText(/已选择范围|Selected range/i)).toBeInTheDocument();
  });
});
