/* @flow */
/* eslint-disable react/no-danger */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import withUIState from 'core/withUIState';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

// This refers to height of `Card-contents` CSS class,
// beyond which it will add read more link.
export const MAX_HEIGHT = 150;

type UIStateType = {|
  showAllContent: boolean,
  readMoreExpanded: boolean,
|};

type Props = {|
  children: React.Element<any>,
  className?: string,
  header?: React.Element<any> | string,
  id: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

const initialUIState: UIStateType = {
  showAllContent: true,
  readMoreExpanded: false,
};

export class ShowMoreCardBase extends React.Component<InternalProps> {
  contents: HTMLElement | null;

  componentWillReceiveProps(nextProps: InternalProps) {
    const { children } = this.props;
    const { children: newChildren } = nextProps;

    let html =
      children.props &&
      children.props.dangerouslySetInnerHTML &&
      children.props.dangerouslySetInnerHTML.__html;

    let newHtml =
      newChildren.props &&
      newChildren.props.dangerouslySetInnerHTML &&
      newChildren.props.dangerouslySetInnerHTML.__html;

    // If it's not html, check for plain text.
    if (!html && children && !children.props) {
      html = children;
    }

    if (!newHtml && newChildren && !newChildren.props) {
      newHtml = newChildren;
    }

    // Reset UIState if component html has changed.
    // This is needed because if you return to an addon that you've
    // already visited the component doesn't hit unmount again and the store
    // keeps the last component's UIState which isn't what we want.
    if (newHtml && html !== newHtml) {
      this.resetUIState();
    }

    // If the read more has already been expanded, we can skip
    // the call to truncate.
    // Ideally this would only be called one time and it wouldn't be
    // needed after the initial set up but we need this here (vs componentDidMount)
    // to get an accurate clientHeight.
    if (!this.props.uiState.readMoreExpanded) {
      this.truncateToMaxHeight(this.contents);
    }
  }

  resetUIState() {
    this.props.setUIState({
      ...initialUIState,
    });
  }

  truncateToMaxHeight = (contents: HTMLElement | null) => {
    const { uiState } = this.props;
    if (contents) {
      // If the contents are short enough they don't need a "show more" link; the
      // contents are expanded by default.
      if (uiState.showAllContent && contents.clientHeight >= MAX_HEIGHT) {
        this.props.setUIState({
          ...uiState,
          showAllContent: false,
        });
      }
    }
  };

  onClick = (event: SyntheticEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    this.props.setUIState({
      showAllContent: true,
      readMoreExpanded: true,
    });
  };

  render() {
    const { children, className, header, id, i18n, uiState } = this.props;
    const { showAllContent } = uiState;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');

    const readMoreLink = (
      <a
        className="ShowMoreCard-expand-link"
        href="#show-more"
        onClick={this.onClick}
        dangerouslySetInnerHTML={sanitizeHTML(
          i18n.gettext(
            // l10n: The "Expand to" text is for screenreaders so the link
            // makes sense out of context. The HTML makes it hidden from
            // non-screenreaders and must stay.
            '<span class="visually-hidden">Expand to</span> Read more',
          ),
          ['span'],
        )}
      />
    );

    return (
      <Card
        className={makeClassName('ShowMoreCard', className, {
          'ShowMoreCard--expanded': showAllContent,
        })}
        header={header}
        footerLink={showAllContent ? null : readMoreLink}
      >
        <div
          className="ShowMoreCard-contents"
          ref={(ref) => {
            this.contents = ref;
          }}
        >
          {children}
        </div>
      </Card>
    );
  }
}

export const extractId = (props: Props) => {
  return props.id;
};

export default compose(
  translate(),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
    resetOnUnmount: true,
  }),
)(ShowMoreCardBase);
