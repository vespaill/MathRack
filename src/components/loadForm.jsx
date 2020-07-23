import React from 'react';
import { Form, InputGroup, FormControl, Button } from 'react-bootstrap';
import '../css/loadForm.css';

const loadForm = props => {
  return (
    <Form onSubmit={e => props.onSubmit(e)}>
      <InputGroup>
        <FormControl
          className="weight-input__form mb-3"
          type="number"
          name="loadInput"
          placeholder="Enter Weight"
          aria-label="weight"
          min="0"
          step="0.5"
          onFocus={e => { e.currentTarget.value = ''; }}
        />
        <InputGroup.Append>
          <InputGroup.Text className="weight-input__text">
            {props.unit}
          </InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
      <Button className="mx-auto d-block" variant="dark" type="submit">
        Load
      </Button>
    </Form>
  );
};

export default loadForm;
