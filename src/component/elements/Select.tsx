/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { CSSProperties, ForwardedRef, forwardRef, useCallback } from 'react';

const arrowDownIcon = `url('data:image/svg+xml;utf8,<svg  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="960px" height="560px" viewBox="0 0 960 560" enable-background="new 0 0 960 560" xml:space="preserve"><g id="Rounded_Rectangle_33_copy_4_1_"><path d="M480,344.181L268.869,131.889c-15.756-15.859-41.3-15.859-57.054,0c-15.754,15.857-15.754,41.57,0,57.431l237.632,238.937c8.395,8.451,19.562,12.254,30.553,11.698c10.993,0.556,22.159-3.247,30.555-11.698l237.631-238.937c15.756-15.86,15.756-41.571,0-57.431s-41.299-15.859-57.051,0L480,344.181z"/></g></svg>')`;

const styles = {
  select: (width: number | string | undefined) => css`
    padding: 0px 5px;
    border: 0.55px solid #cacaca;
    font-size: 14px;
    width: ${width ? Number(width) - 5 : 115}px;
    margin: 0;
    height: 100%;
    background: ${arrowDownIcon} no-repeat right white;
    -webkit-appearance: none;
    background-position-x: calc(100% - 5px);
    background-size: 15px 15px;
    border-radius: 5px;
    margin: 0px 5px;
    align-self: center;
    &:focus,
    input:focus {
      outline: none;
    }

    &:required:invalid {
      color: #666;
    }
  `,
};

export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'style' | 'onChange'
  > {
  onChange?: (element: any) => void;
  items: any[];
  defaultValue?: string | number | undefined;
  style?: CSSProperties;
  placeholder?: string;
  itemValueField?: string;
  itemTextField?: string;
  returnValue?: boolean;
  textRender?: (text: string) => string;
}

const Select = forwardRef(function Select(
  props: SelectProps,
  ref: ForwardedRef<HTMLSelectElement>,
) {
  const {
    items,
    style = { width: 100 },
    onChange = () => null,
    defaultValue,
    value,
    name = '',
    className = '',
    placeholder = '',
    itemValueField = 'value',
    itemTextField = 'label',
    returnValue = true,
    textRender,
  } = props;

  const handleOnChanged = useCallback(
    (e) => {
      const [option] = e.target.selectedOptions;
      const selectedData = JSON.parse(option.dataset.value);
      onChange(returnValue ? selectedData[itemValueField] : selectedData);
    },
    [itemValueField, onChange, returnValue],
  );

  return (
    <select
      ref={ref}
      css={styles.select(style?.width)}
      name={name}
      onChange={handleOnChanged}
      defaultValue={defaultValue}
      value={value}
      className={className}
      style={style}
      required
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {items.map((option) => (
        <option
          key={JSON.stringify(option)}
          value={option[itemValueField]}
          data-value={JSON.stringify(option)}
        >
          {textRender?.(option[itemTextField]) || option[itemTextField]}
        </option>
      ))}
    </select>
  );
});

export default Select;
